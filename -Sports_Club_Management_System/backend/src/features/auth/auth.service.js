const bcrypt = require('bcrypt');
const authRepository = require('./auth.repository');
const { generateToken } = require('../../shared/utils/jwt');

class AuthService {
  /**
   * Register a new user
   */
  async register(registerDto) {
    const {
      fullName,
      email,
      password,
      phone,
      role = 'NON_MEMBER',
      clubId,
      dateOfBirth,
      guardianId,
      referralCode,
    } = registerDto;

    // 1. Check if user email already registered
    const existingUser = await authRepository.findByEmail(email);
    if (existingUser) {
      const err = new Error('User with this email already exists.');
      err.statusCode = 409;
      throw err;
    }

    // 2. Enforce Rule: clubId is for STAFF/OWNER/KITCHEN/COACH, AND the club MUST BE VERIFIED!
    const clubAssignedRoles = ['CLUB_OWNER', 'STAFF', 'KITCHEN_MANAGER', 'COACH'];
    let finalClubId = null;

    if (clubAssignedRoles.includes(role)) {
      if (!clubId) {
        const err = new Error(`Club ID is required when registering for role '${role}'.`);
        err.statusCode = 400;
        throw err;
      }

      const club = await authRepository.findClubById(clubId);
      if (!club) {
        const err = new Error(`Club with ID '${clubId}' not found.`);
        err.statusCode = 404;
        throw err;
      }

      finalClubId = clubId;
    } else {
      // For MEMBER, NON_MEMBER, PLATFORM_ADMIN in standard registration, clubId is set to null
      finalClubId = null;
    }

    // 3. Junior Age Verification (<18 requires Guardian)
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      const age = this.calculateAge(dob);
      if (age < 18) {
        if (!guardianId) {
          const err = new Error('Guardian ID is mandatory for minor/Junior registration (under 18 years old).');
          err.statusCode = 400;
          throw err;
        }
        const guardian = await authRepository.findById(guardianId);
        if (!guardian) {
          const err = new Error('Guardian user record not found.');
          err.statusCode = 404;
          throw err;
        }
      }
    }

    // 4. Hash Password
    const passwordHash = await bcrypt.hash(password, 10);

    // 5. Determine initial account status
    const staffRoles = ['STAFF', 'COACH', 'KITCHEN_MANAGER'];
    const initialStatus = staffRoles.includes(role) ? 'PENDING' : 'APPROVED';

    // 6. Create User Record
    const newUser = await authRepository.createUser({
      clubId: finalClubId,
      role,
      fullName,
      email,
      passwordHash,
      phone,
      dateOfBirth,
      guardianId,
      creditLimit: 0.00,
      status: initialStatus,
    });

    if (initialStatus === 'PENDING') {
      return {
        user: {
          id: newUser.id,
          fullName: newUser.full_name,
          email: newUser.email,
          role: newUser.role,
          clubId: newUser.club_id,
          status: 'PENDING',
        },
        requiresApproval: true,
        message: `Registration submitted successfully! Your account as ${role} is pending verification by the club owner before you can log in.`,
      };
    }

    // 7. Generate JWT Token (For APPROVED accounts)
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      clubId: newUser.club_id,
    });

    return {
      user: {
        id: newUser.id,
        fullName: newUser.full_name,
        email: newUser.email,
        role: newUser.role,
        clubId: newUser.club_id,
        status: newUser.status,
        pointsBalance: newUser.points_balance,
        creditLimit: parseFloat(newUser.credit_limit),
      },
      token,
    };
  }

  /**
   * QR-Code Signup (Redirects user to sign up under specific club)
   */
  async qrSignup(qrSignupDto) {
    const { clubId } = qrSignupDto;

    // Validate that the club exists
    const club = await authRepository.findClubById(clubId);
    if (!club) {
      const err = new Error(`Club with ID '${clubId}' not found for QR Signup.`);
      err.statusCode = 404;
      throw err;
    }

    const {
      fullName,
      email,
      password,
      phone,
      dateOfBirth,
      guardianId,
    } = qrSignupDto;

    // Register member bound to the scanned club
    const existingUser = await authRepository.findByEmail(email);
    if (existingUser) {
      const err = new Error('User with this email already exists.');
      err.statusCode = 409;
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await authRepository.createUser({
      clubId,
      role: 'NON_MEMBER',
      fullName,
      email,
      passwordHash,
      phone,
      dateOfBirth,
      guardianId,
      creditLimit: 0.00,
    });

    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      clubId: newUser.club_id,
    });

    return {
      user: {
        id: newUser.id,
        fullName: newUser.full_name,
        email: newUser.email,
        role: newUser.role,
        clubId: newUser.club_id,
        pointsBalance: newUser.points_balance,
        creditLimit: parseFloat(newUser.credit_limit),
      },
      token,
    };
  }

  /**
   * Login user with email & password
   */
  async login(loginDto) {
    const { email, password } = loginDto;

    const user = await authRepository.findByEmail(email);
    if (!user) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    if (!user.password_hash) {
      const err = new Error('Invalid credentials. Password not set.');
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    // Check user account verification status for staff/coaches/kitchen managers
    const staffRoles = ['STAFF', 'COACH', 'KITCHEN_MANAGER'];
    if (staffRoles.includes(user.role) || (user.status && user.status !== 'APPROVED')) {
      if (user.status === 'PENDING') {
        const err = new Error(
          `Login blocked: Your account as ${user.role} is currently pending verification by the club owner. Please contact your club manager to approve your account.`
        );
        err.statusCode = 403;
        throw err;
      }
      if (user.status === 'REJECTED') {
        const err = new Error(
          `Login blocked: Your registration request as ${user.role} was rejected by the club owner.`
        );
        err.statusCode = 403;
        throw err;
      }
    }

    // If staff/owner role, verify club is verified
    let clubName = null;
    if (user.club_id) {
      const club = await authRepository.findClubById(user.club_id);
      if (club) {
        clubName = club.name;
        if (user.role === 'CLUB_OWNER' && !club.is_verified) {
          const err = new Error(`Login blocked: Club '${club.name}' is currently pending verification. Account access will be granted once platform admin approves your club.`);
          err.statusCode = 403;
          throw err;
        }
      }
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      clubId: user.club_id,
    });

    return {
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        clubId: user.club_id,
        club_id: user.club_id,
        clubName: clubName,
        club_name: clubName,
        pointsBalance: user.points_balance,
        creditLimit: parseFloat(user.credit_limit),
      },
      token,
    };
  }

  /**
   * Fetch Profile for Authenticated User
   */
  async getProfile(userId) {
    const user = await authRepository.findById(userId);
    if (!user) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      throw err;
    }

    let clubName = null;
    if (user.club_id) {
      const club = await authRepository.findClubById(user.club_id);
      if (club) {
        clubName = club.name;
      }
    }

    return {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      clubId: user.club_id,
      club_id: user.club_id,
      clubName: clubName,
      club_name: clubName,
      dateOfBirth: user.date_of_birth,
      pointsBalance: user.points_balance,
      creditLimit: parseFloat(user.credit_limit),
      currentPayLaterBalance: parseFloat(user.current_pay_later_balance),
      createdAt: user.created_at,
    };
  }

  calculateAge(dob) {
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  }
}

module.exports = new AuthService();

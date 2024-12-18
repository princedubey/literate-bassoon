import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import UserModel, { IUser } from "../models/User";
import { generateToken, setTokensInCookies } from "../middlewares/authHandler";

// Register User
export const registerUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const {
    firstName, middleName, lastName, gender, dob, bloodGroup, height, weight,
    complexion, hobbies, aboutMe, profileImages,
    phoneNumber, email, highestEducation, otherEductionDetail, jobType,
    designation, workDetail, income, religion, caste, subCaste, gotra,
    raasi, fatherName, fatherOccupation, motherName, motherOccupation,
    noOfSiblings, noOfBrothers, noOfSisters, familyType, spouseExpctation,
    residentialAddr, permanentAddr, createdBy, tags, password
  } = req.body;

  try {
    // Check if user already exists
    const userExists = await UserModel.findOne({ "contactInfo.email": email });
    if (userExists) {
      res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user
    const newUser = new UserModel({
      createdBy,
      personalInfo: { firstName, middleName, lastName, gender, dob, bloodGroup, height, weight, complexion, hobbies, aboutMe, profileImages },
      contactInfo: { phoneNumber, email, password: hashedPassword },
      residentialAddr,
      permanentAddr,
      eduAndProfInfo: { highestEducation, otherEductionDetail, jobType, designation, workDetail, income },
      cultureAndReligiousInfo: { religion, caste, subCaste, gotra, raasi },
      familyInfo: { fatherName, fatherOccupation, motherName, motherOccupation, noOfSiblings, noOfBrothers, noOfSisters, familyType },
      spouseExpctation,
      tags,
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        firstName: newUser.personalInfo.firstName,
        lastName: newUser.personalInfo.lastName,
        email: newUser.contactInfo.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Login User
export const loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email, password }: { email: string; password: string } = req.body;

  try {
    // Find user by email
    const user = await UserModel.findOne({ "contactInfo.email": email });
    if (!user) {
      res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.contactInfo.password);
    if (!isMatch) {
      res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT tokens
    const accessToken = generateToken(user);
    const refreshToken = generateToken(user, 'refresh');

    // Set tokens in cookies
    setTokensInCookies(res, accessToken, refreshToken);

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: {
        userId: user._id,
        name: `${user.personalInfo.firstName} ${user.personalInfo.lastName}`,
        email: user.contactInfo.email,
        access_token: accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get User Profile
export const getUserProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await UserModel.findById(req.user); //TODO
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User profile fetched successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

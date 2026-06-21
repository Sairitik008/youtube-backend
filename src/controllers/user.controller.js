import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    /*
    1)get user details from frontend 
    2)validation :not empty
    3) check if user already exists :username ,email
    4)check for images , check for avatar
    5)upload them in cloudinary
    6)create user object :create entry in db
    7)remove password and refresh token from responses
    8)check for user creation (if user created return response otherwise send error)
   */

    const { fullname, email, username, password } = req.body
    console.log("email:", email)

    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existingUser = User.findOne({ $or: [{ email }, { username }] })
    console.log("Exisiting User: ", existingUser)
    if (existingUser) {
        throw new ApiError(409, " User with email or username already exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    console.log("file data: ", avatarLocalPath);

    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    console.log("Cover Image: ", coverImageLocalPath)

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }


    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar is Required");
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user")
    }

    return res.status(201).json(new ApiResponse(200, createdUser, "User Registered Successfully"))




})

export { registerUser }
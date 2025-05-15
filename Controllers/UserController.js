import UserModel from "../Models/userModel.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// get all users

export const getAllUsers = async (req, res) => {
    try {
        let users = await UserModel.find();
        users = users.map((user) => {
            const { password, ...otherDetails } = user._doc;
            return otherDetails;
        });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json(error);
    }
};

// get the user
export const getUser = async (req, res) => {
    const id = req.params.id;
    try {
        const user = await UserModel.findById(id);

        if (user) {
            const { password, ...otherDetails } = user._doc;
            res.status(200).json(otherDetails);
        }
        else {
            res.status(404).json({ message: "No such User exists." });
        }
    } catch (error) {
        res.status(500).json(error);
    }
};

// update the user
export const updateUser = async (req, res) => {
    const id = req.params.id;
    const { _id, currentUserAdminstatus, password } = req.body;

    if (id === _id) {
        try {
            if (password) {
                const salt = await bcrypt.genSalt(10);
                req.body.password = await bcrypt.hash(password, salt);
            }

            const user = await UserModel.findByIdAndUpdate(id, req.body, { new: true });

            const token = jwt.sign(
                { username: user.username, id: user._id },
                process.env.JWT_KEY,
                { expiresIn: '1h' }
            );
            res.status(200).json({ user, token });
        } catch (error) {
            res.status(500).json(error);
        }
    }
    else {
        res.status(403).json("Access denied !! you can only update your own profile");
    }
};

// delete the user
export const deleteUser = async (req, res) => {
    const id = req.params.id;
    const { currentUserId, currentUserAdminstatus } = req.body;

    if (currentUserId === id || currentUserAdminstatus) {
        try {
            await UserModel.findByIdAndDelete(id);
            res.status(200).json("User deleted successfully.");
        } catch (error) {
            res.status(500).json(error);
        }
    }
    else {
        res.status(403).json("Access denied !! you can only delete your own profile");
    }
};

// follow a user
export const followUser = async (req, res) => {
    const id = req.params.id;
    const { _id } = req.body;

    if (_id === id) {
        res.status(403).json("Action forbidden");
    }
    else {
        try {
            const followUser = await UserModel.findById(id);
            const followingUser = await UserModel.findById(_id);

            if (!followUser.followers.includes(_id)) {
                await followUser.updateOne({ $push: { followers: _id } });
                await followingUser.updateOne({ $push: { following: id } });
                res.status(200).json("User followed successfully.");
            }
            else {
                res.status(403).json("User is already following you.");
            }
        } catch (error) {
            res.status(500).json(error);
        }
    }
};

// Unfollow a user
export const UnFollowUser = async (req, res) => {
    const id = req.params.id;
    const { _id } = req.body;

    if (_id === id) {
        res.status(403).json("Action forbidden");
    }
    else {
        try {
            const followUser = await UserModel.findById(id);
            const followingUser = await UserModel.findById(_id);

            if (followUser.followers.includes(_id)) {
                await followUser.updateOne({ $pull: { followers: _id } });
                await followingUser.updateOne({ $pull: { following: id } });
                res.status(200).json("User Unfollowed successfully.");
            }
            else {
                res.status(403).json("User is not following you.");
            }
        } catch (error) {
            res.status(500).json(error);
        }
    }
};
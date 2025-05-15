import UserModel from "../Models/userModel.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

//Register new user
export const registerUser = async (req, res) => {

    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(req.body.password, salt);

    req.body.password = hashedPass
    const newUser = new UserModel(req.body);
    const { username } = req.body;

    try {
        const oldUser = await UserModel.findOne({ username })
        if (oldUser) {
            return res.status(409).json({ message: "Username already registered!." });
        }
        const user = await newUser.save();

        const token = jwt.sign({
            username: user.username, id: user._id
        }, process.env.JWT_KEY, { expiresIn: '1h' });
        res.status(200).json({ message: "User registered successfully!", user, token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//Login existing user
export const loginUser = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await UserModel.findOne({ username: username });
        if (user) {
            const validity = await bcrypt.compare(password, user.password);

            if (!validity) {
                return res.status(400).json({ message: "Invalid Password" });
            }else{
                const token = jwt.sign({
                    username: user.username, id: user._id
                }, process.env.JWT_KEY, { expiresIn: '1h' });
                res.status(200).json({ message: "Login successful!", user, token });
            }
        }
        else {
            res.status(404).json({ message: "User does not exists." });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

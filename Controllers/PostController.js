import PostModel from '../Models/postModel.js';
import mongoose from 'mongoose';
import UserModel from '../Models/userModel.js';

// create a new post
export const createPost = async (req, res) => {
    const newPost = new PostModel(req.body);
    try {
        await newPost.save();
        res.status(201).json({ message: "Post created successfully.", newPost });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// get a posts
export const getPost = async (req, res) => {
    const id = req.params.id;
    try {
        const post = await PostModel.findById(id);
        res.status(200).json(post);
    } catch (error) {
        res.status(500).json(error);
    }
};

// update a post
export const updatePost = async (req, res) => {
    const postId = req.params.id;
    const { userId } = req.body;
    try {
        const post = await PostModel.findById(postId);
        if (post.userId === userId) {
            await post.updateOne({ $set: req.body });
            res.status(200).json("Post updated successfully.");
        }
        else {
            res.status(403).json("Action forbidden.");
        }
        } catch (error) {
        res.status(500).json(error);
    }
};

// delete a post
export const deletePost = async (req, res) => {
    const id = req.params.id;
    const { userId } = req.body;
    try {
        const post = await PostModel.findById(id);
        if (post.userId === userId) {
            await post.deleteOne();
            res.status(200).json("Post deleted successfully.");
        }
        else {
            res.status(403).json("Action forbidden.");
        }
    } catch (error) {
        res.status(500).json(error);
    }
};

// like/dislike a post
export const likePost = async (req, res) => {
    const id = req.params.id;
    const { userId } = req.body;
    try {
        const post = await PostModel.findById(id);
        if (!post.likes.includes(userId)) {
            await post.updateOne({ $push: { likes: userId } });
            res.status(200).json("Post liked successfully.");
        }
        else {
            await post.updateOne({ $pull: { likes: userId } });
            res.status(200).json("Post Unliked successfully.");
        }
    } catch (error) {
        res.status(500).json(error);
    }
};

// get timeline posts
export const getTimelinePosts = async (req, res) => {
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
    }
    try {
        const currentUserPosts = await PostModel.find({ userId: new mongoose.Types.ObjectId(userId) });
        const followingPosts = await UserModel.aggregate([
            {
                $match: { 
                    _id: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "posts",
                    localField: "following",
                    foreignField: "userId",
                    as: "followingPosts"
                }
            },
            {
                $project: {
                    followingPosts: 1,
                    _id: 0                
                }
            }
        ]) ;
        if (!followingPosts.length) {
            return res.status(200).json(currentUserPosts);
        }
        res.status(200)
            .json(currentUserPosts.concat(...followingPosts[0].followingPosts)
            .sort((a, b) => {
                return b.createdAt - a.createdAt;
            })
        );      
    } catch (error) {
        res.status(500).json(error);
    }
};


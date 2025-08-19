import mongoose from "mongoose";

const connectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGODBURL);
        console.log('DB Connected!')
    } catch (error) {
        console.log('MongoDB Error : ' + error.message)
        process.exit(1) // exits with one failure
    }
}

export default connectDb;
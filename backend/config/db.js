import mongoose from 'mongoose';

export const connectDB = async() => {
    try{
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB connection successful!`);
    }catch(error){
        console.error(`MongoDB connection Failed: ${error.message}`);
        process.exit(1);
    }
}

import mongoose from "mongoose";
import onMounted from "../hooks/onMounted";

export const connectDB = async () => {
    try {
        const connection = await mongoose.connect(process.env.MONGO_URI!, {})
        console.log(`MongoDB Connected:${connection.connection.host}`)
        onMounted();
    } catch (error) {
        console.error((error as Error).message);
    }
}

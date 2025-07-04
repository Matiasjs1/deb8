import mongoose from 'mongoose'

const connectdb = async () => {
    try{
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/deb8db');
        console.log("Connected to database");
        
    }
    catch(error){
        console.log(error);
    }
    
}
export default connectdb
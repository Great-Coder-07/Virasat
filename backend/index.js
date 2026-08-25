import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import connectDb from "./utils/db.js";
import userRoute from "./routes/user.route.js";
import familyRoute from "./routes/family.route.js";
import circleRoute from "./routes/circle.route.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const corsOptions = {
    origin: "http://localhost:5173",
    credentials: true,
};

app.use(cors(corsOptions));

const PORT = process.env.PORT || 3000;

app.use("/api/v1/user", userRoute);
app.use("/api/v1/family", familyRoute);
app.use("/api/v1/circle", circleRoute);

const startServer = async () => {
    try {
        await connectDb();
        app.listen(PORT, () => {
            console.log(`Server is running successfully on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Backend startup failed because the database connection could not be established.");
        process.exit(1);
    }
};

startServer();

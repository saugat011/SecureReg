import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/auth.routes";

const app = express();

app.use(express.json());
app.use(cookieParser());

// allow Next frontend
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

app.get("/", (_req, res) => res.send("API running"));
app.use("/auth", authRoutes);

const PORT = Number(process.env.PORT ?? 4001);
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));

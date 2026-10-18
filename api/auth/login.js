import { login } from "../../src/backend/controllers/authController.js";

export default async function handler(req, res) {
    return login(req, res);
}

const express = require("express");
const bodyParser = require("body-parser");
const sql = require("./db");
const multer = require("multer");

const app = express();
const port = 3000;


const upload = multer({ dest: "images/" }); 

app.use(express.static(__dirname));
app.use("/images", express.static("images"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/users", (req, res) => {
    sql.query("SELECT * FROM users", (err, results) => {
        if (err) {
            console.log("error: ", err);
            res.status(400).send("error in getting users");
            return;
        }

        res.send(results);
    });
});
app.get("/profiles", (req, res) => {
    sql.query(
        `SELECT 
            users.email,
            profiles.user_id,
            profiles.full_name,
            profiles.birthdate,
            profiles.phone,
            profiles.gender,
            profiles.location,
            profiles.budget,
            profiles.cleanliness,
            profiles.smoking,
            profiles.pets,
            profiles.description,
            profiles.profile_pic
        FROM profiles
        JOIN users ON profiles.user_id = users.user_id`,
        (err, results) => {
            if (err) {
                console.log("error getting profiles:", err);
                res.status(400).send("Error getting profiles");
                return;
            }

            res.send(results);
        }
    );
});
app.get("/profile/:user_id", (req, res) => {
    const userId = req.params.user_id;

    sql.query(
        `SELECT 
            users.email,
            profiles.*
        FROM profiles
        JOIN users ON profiles.user_id = users.user_id
        WHERE profiles.user_id = ?`,
        [userId],
        (err, results) => {
            if (err) {
                console.log("error getting profile:", err);
                res.status(400).send("Error getting profile");
                return;
            }

            if (results.length === 0) {
                res.status(404).send("Profile not found");
                return;
            }

            res.send(results[0]);
        }
    );
});
app.put("/profile/:user_id", upload.single("profilePic"), (req, res) => {
    const userId = req.params.user_id;

    const {
        phone,
        gender,
        occupation,
        description,
        location,
        budget,
        cleanliness,
        smoking,
        pets
    } = req.body;

    let query = `UPDATE profiles
                 SET phone = ?, gender = ?, occupation = ?, description = ?,
                     location = ?, budget = ?, cleanliness = ?, smoking = ?, pets = ?`;
    let params = [phone, gender, occupation, description, location, budget, cleanliness, smoking, pets];

    if (req.file) {
        query += `, profile_pic = ?`;
        params.push(req.file.path);
    }

    query += ` WHERE user_id = ?`;
    params.push(userId);

    sql.query(query, params, (err) => {
        if (err) {
            console.log("error updating profile:", err);
            res.status(400).send("Error updating profile");
            return;
        }

        res.status(200).send("Profile updated successfully");
    });
});

app.delete("/profile/:user_id", (req, res) => {
    const userId = req.params.user_id;

    sql.query(
        "DELETE FROM users WHERE user_id = ?",
        [userId],
        (err) => {
            if (err) {
                console.log("error deleting user:", err);
                res.status(400).send("Error deleting user");
                return;
            }

            res.status(200).send("User deleted successfully");
        }
    );
});

app.post("/signup", (req, res) => {
    const {
        email,
        password,
        fullName,
        birthdate,
        phone,
        gender,
        location,
        budget,
        cleanliness,
        smoking,
        pets
    } = req.body;

    sql.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
        if (err) {
            console.log("error checking email:", err);
            res.status(400).send("Error checking email");
            return;
        }

        if (results.length > 0) {
            res.status(400).send("Email already exists");
            return;
        }

        sql.query(
            "INSERT INTO users (email, password) VALUES (?, ?)",
            [email, password],
            (err, userResult) => {
                if (err) {
                    console.log("error creating user:", err);
                    res.status(400).send("Error creating user");
                    return;
                }

                const userId = userResult.insertId;

                sql.query(
                    `INSERT INTO profiles 
                    (user_id, full_name, birthdate, phone, gender, location, budget, cleanliness, smoking, pets)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [userId, fullName, birthdate, phone, gender, location, budget, cleanliness, smoking, pets],
                    (err) => {
                        if (err) {
                            console.log("error creating profile:", err);
                            console.log(err.sqlMessage);
                            res.status(400).send("Error creating profile");
                            return;
                        }

                        res.redirect(`/search.html?user_id=${userId}`);
                    }
                );
            }
        );
    });
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;

    sql.query(
        "SELECT * FROM users WHERE email = ? AND password = ?",
        [email, password],
        (err, results) => {
            if (err) {
                console.log("error logging in:", err);
                res.status(400).send("Login error");
                return;
            }

            if (results.length === 0) {
                res.redirect("/login.html?login=failed");
                return;
            }

            res.redirect(`/search.html?user_id=${results[0].user_id}`);
        }
    );
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
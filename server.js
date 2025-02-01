import express from 'express';
import { configDotenv } from 'dotenv';
import bcrypt from 'bcryptjs';
import { readFile } from 'fs';

configDotenv();
const port = process.env.PORT || 5000;
const dataPath = process.env.DATAPATH;
const app = express();

app.use(express.json());

app.use('/', (req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

async function middleware(req, res, next) {
    try {
        const { passwd } = req.body;
        if (!passwd) {
            return res.status(401).json({ message: "Unauthorized Access" });
        }

        const isPassCorrect = await bcrypt.compare(passwd, process.env.PASS);

        if (isPassCorrect) {
            readFile(dataPath, 'utf8', (err, data) => {
                if (err) {
                    console.error('Error reading file:', err.message);
                    return res.status(500).json({ message: "Internal Server Error" });
                }
                req.data = JSON.parse(data);
                next();
            });
        } else {
            return res.status(401).json({ message: "Incorrect password" });
        }
    } catch (err) {
        console.log('Error at /:', err.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

function searchStudents(data, field, value) {
    const results = [];
    for (const _class in data) {
        const res = data[_class].filter(student => student[field].trim().includes(value.toUpperCase().trim()));
        if (res.length) {
            results.push(...res);  // Add all matching students to results
        }
    }
    return results;
}

app.post('/', middleware, async (req, res) => {
    try {
        const data = req.data;
        const { name, roll, phone } = req.body;
        const clazz = req.body.class;

        if (!name && !roll && !clazz && !phone) {
            return res.status(200).json(data);
        }

        let results = [];

        if (clazz) {
            results = data[clazz] || [];
        } else if (name) {
            results = searchStudents(data, 'Name', name);
        } else if (roll) {
            results = searchStudents(data, 'Roll No.', roll);
        } else if (phone) {
            results = searchStudents(data, 'Phone', phone);
        }

        if (results.length) {
            return res.status(200).json(results);
        } else {
            return res.status(404).json({ message: "Student Not Found" });
        }

    } catch (err) {
        console.log('Error at /:', err.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

app.listen(port, () => {
    console.log('Server started at port '+port);
});
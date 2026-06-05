const request = require('supertest');
const mongoose = require('mongoose');
jest.mock('../../config/db', () => jest.fn());
const app = require('../../app');
const jwt = require('jsonwebtoken');
const User = require('../auth/user.model');

// Mock Auth
jest.mock('jsonwebtoken');
jest.mock('../auth/user.model');

describe('Code Execution API', () => {
    let token = 'mocktoken';

    beforeAll(() => {
        jwt.verify.mockReturnValue({ id: 'mockuser123' });
        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue({ _id: 'mockuser123', username: 'mockuser' })
        });
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    it('should block requests without authentication', async () => {
        const res = await request(app)
            .post('/api/code/execute')
            .send({
                language: 'javascript',
                code: 'console.log("hello");'
            });
        
        console.log("STATUS:", res.status);
        console.log("BODY:", res.body);
        console.log("TEXT:", res.text);
        expect(res.status).toBe(401);
    });

    it('should successfully execute JavaScript code', async () => {
        const res = await request(app)
            .post('/api/code/execute')
            .set('Authorization', `Bearer ${token}`)
            .send({
                language: 'javascript',
                code: 'console.log("Hello from Test!");'
            });

        expect(res.status).toBe(200);
        expect(res.body.run).toBeDefined();
        expect(res.body.run.stdout.trim()).toBe('Hello from Test!');
        expect(res.body.run.code).toBe(0);
    });

    it('should preserve JavaScript operators before execution', async () => {
        const res = await request(app)
            .post('/api/code/execute')
            .set('Authorization', `Bearer ${token}`)
            .send({
                language: 'javascript',
                code: 'const nums = [1, 2, 3];\nconst bigger = nums.filter((n) => n > 1);\nconsole.log(bigger.join(","));'
            });

        expect(res.status).toBe(200);
        expect(res.body.run).toBeDefined();
        expect(res.body.run.stdout.trim()).toBe('2,3');
        expect(res.body.run.stderr).toBe('');
        expect(res.body.run.code).toBe(0);
    });

    it('should successfully execute Python code', async () => {
        const res = await request(app)
            .post('/api/code/execute')
            .set('Authorization', `Bearer ${token}`)
            .send({
                language: 'python',
                code: 'print("Hello Python!")'
            });

        expect(res.status).toBe(200);
        expect(res.body.run).toBeDefined();
        expect(res.body.run.stdout.trim()).toBe('Hello Python!');
        expect(res.body.run.code).toBe(0);
    });

    it('should time out infinite loops after 5 seconds', async () => {
        const res = await request(app)
            .post('/api/code/execute')
            .set('Authorization', `Bearer ${token}`)
            .send({
                language: 'javascript',
                code: 'while(true) {}'
            });

        expect(res.status).toBe(200);
        expect(res.body.run).toBeDefined();
        expect(res.body.run.stderr).toContain('Code execution timed out');
        expect(res.body.run.code).toBe(124);
    }, 10000);
});

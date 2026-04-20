oconst mongoose = require("mongoose");
const Project = require("./models/Project");
const Task = require("./models/Task");
const Note = require("./models/Note");
const CalendarEvent = require("./models/CalendarEvent");
const Notification = require("./models/Notification");
const User = require("./models/User");

// Replace with your MongoDB URI if different
const MONGO_URI = "mongodb://localhost:27017/herald"; 

async function verifyCascadeDeletion() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB.");

        // 1. Setup Test Data
        let user = await User.findOne({ email: "test@example.com" });
        if (!user) {
            user = await User.create({ 
                name: "Test User", 
                email: "test@example.com", 
                password: "$2a$10$abcdefghijklmnopqrstuv", // dummy hash
                isVerified: true 
            });
        }
        const userId = user._id;
        console.log(`Using User ID: ${userId}`);

        const project = await Project.create({ name: "Test Deletion Project", owner: userId });
        const projectId = project._id;
        console.log(`Created Project ID: ${projectId}`);

        const task = await Task.create({ title: "Test Deletion Task", project: projectId, user: userId, status: "todo" });
        const taskId = task._id;
        console.log(`Created Task ID: ${taskId}`);

        const note = await Note.create({ title: "Test Deletion Note", project: projectId, user: userId });
        console.log("Created Note.");

        const calendarEvent = await CalendarEvent.create({ 
            title: "Test Deletion Event", 
            project: projectId, 
            task: taskId, 
            user: userId, 
            startDate: new Date(), 
            endDate: new Date(), 
            createdBy: userId 
        });
        console.log("Created CalendarEvent.");

        const notification = await Notification.create({ 
            user: userId, 
            title: "Test Notification", 
            message: "Test", 
            metadata: { projectId, taskId } 
        });
        console.log("Created Notification.");

        console.log("All test data created successfully.");

        // 2. Perform Simulated Cascade Deletion (Task Deletion first)
        console.log("Simulating Task Deletion...");
        const taskToDelete = await Task.findById(taskId);
        if (taskToDelete) {
            await Promise.all([
                CalendarEvent.deleteMany({ task: taskId }),
                Notification.deleteMany({
                    $or: [
                        { "metadata.taskId": taskId },
                        { "metadata.taskId": taskId.toString() }
                    ]
                })
            ]);
            await taskToDelete.deleteOne();
        }

        // Verify task-related stuff is gone
        const taskEventsCount = await CalendarEvent.countDocuments({ task: taskId });
        const taskNotificationsCount = await Notification.countDocuments({ "metadata.taskId": taskId.toString() });
        console.log(`Remaining Events for Task: ${taskEventsCount}`);
        console.log(`Remaining Notifications for Task: ${taskNotificationsCount}`);

        // 3. Perform Simulated Cascade Deletion (Project Deletion)
        console.log("Simulating Project Deletion...");
        const projectToDelete = await Project.findById(projectId);
        if (projectToDelete) {
            const taskIds = await Task.find({ project: projectId }).distinct("_id");
            await Promise.all([
                Task.deleteMany({ project: projectId }),
                Note.deleteMany({ project: projectId }),
                CalendarEvent.deleteMany({ 
                    $or: [
                        { project: projectId },
                        { task: { $in: taskIds } }
                    ]
                }),
                Notification.deleteMany({
                    $or: [
                        { "metadata.projectId": projectId },
                        { "metadata.projectId": projectId.toString() },
                        { "metadata.taskId": { $in: taskIds } },
                        { "metadata.taskId": { $in: taskIds.map(tid => tid.toString()) } }
                    ]
                })
            ]);
            await projectToDelete.deleteOne();
        }

        // Verify project-related stuff is gone
        const projectTasksCount = await Task.countDocuments({ project: projectId });
        const projectNotesCount = await Note.countDocuments({ project: projectId });
        const projectEventsCount = await CalendarEvent.countDocuments({ project: projectId });
        const projectNotificationsCount = await Notification.countDocuments({ 
            $or: [
                { "metadata.projectId": projectId.toString() },
                { "metadata.projectId": projectId }
            ]
        });

        console.log(`Remaining Tasks for Project: ${projectTasksCount}`);
        console.log(`Remaining Notes for Project: ${projectNotesCount}`);
        console.log(`Remaining Events for Project: ${projectEventsCount}`);
        console.log(`Remaining Notifications for Project: ${projectNotificationsCount}`);

        if (projectTasksCount === 0 && projectNotesCount === 0 && projectEventsCount === 0 && projectNotificationsCount === 0) {
            console.log("✅ Cascade deletion VERIFIED.");
        } else {
            console.log("❌ Cascade deletion FAILED.");
        }

    } catch (error) {
        if (error.name === 'ValidationError') {
            console.error("Error during verification: ValidationError");
            Object.keys(error.errors).forEach(key => {
                console.error(`- ${key}: ${error.errors[key].message}`);
            });
        } else {
            console.error("Error during verification:", error);
        }
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    }
}

verifyCascadeDeletion();
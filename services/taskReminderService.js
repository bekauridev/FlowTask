const schedule = require("node-schedule");
const moment = require("moment-timezone");
const Task = require("../models/taskModel");
const asyncMiddleware = require("../middlewares/asyncMiddleware");

const AppError = require("../utils/AppError");
const sendEmail = require("./emailService");

// Function to construct a list of upcoming tasks for the email
const buildUpcomingTasksList = (tasks) => {
  return Object.entries(tasks).reduce((message, [deadlineTime, tasks]) => {
    const formattedDate = moment()
      .add(parseInt(deadlineTime), "days")
      .locale("ka")
      .format("DD MMMM YYYY");

    const taskList = tasks.reduce((list, task) => {
      const organizationName = task.organization?.name || "უცნობი ორგანიზაცია";
      return `${list}🏢 ${organizationName} \n   დავალება: ${task.title}\n\n`;
    }, "");

    return `${message}\nდარჩენილი დრო: ${deadlineTime} დღე (${formattedDate}) \n\n${taskList}`;
  }, "");
};
// Function to check task deadlines
const checkTaskDeadlines = async () => {
  const now = moment().utc();
  const fiveDaysLater = moment(now)
    .add(5, "days")
    .set({ hour: 12, minute: 0, second: 0, millisecond: 0 });
  const oneDayLater = moment(now)
    .add(1, "days")
    .set({ hour: 12, minute: 0, second: 0, millisecond: 0 });

  // Find tasks that are due exactly 5 days from now and are not completed
  const tasks = await Task.find({
    // archived: false,
    status: "progress",
    deadline: {
      $gte: now.startOf("day").toDate(),
      $lte: fiveDaysLater.endOf("day").toDate(),
    },
  })
    .populate("organization")
    .populate("user");

  // console.log(now.startOf("day").toDate(), fiveDaysLater.endOf("day").toDate());
  // console.log(`Found ${tasks.length} tasks with 5 days left before deadline`);
  if (tasks.length > 0) {
    // Combine tasks for the same user into a single notification
    const tasksByUser = tasks.reduce((accumulator, task) => {
      // const user = task.user.email; // Assuming user email is the identifier
      const { email, isVerified } = task.user;
      const deadlineTime = moment(task.deadline).diff(now, "days"); // Get the deadline time in days
      // console.log(deadlineTime);
      // console.log(user.isVerified);

      if (!isVerified) return accumulator;

      if (deadlineTime === 5 || deadlineTime === 1) {
        accumulator[email] = accumulator[email] || {}; // Create an object if it doesn't exist
        accumulator[email][deadlineTime] = accumulator[email][deadlineTime] || []; // Create an array if it doesn't exist
        accumulator[email][deadlineTime].push(task); // Add the task to the array
      }
      return accumulator;
    }, {});
    // Send separate emails for each user with their upcoming tasks list
    for (const email in tasksByUser) {
      if (tasksByUser[email][5] === undefined && tasksByUser[email][1] === undefined)
        continue;
      const deadlineInfiveDay = tasksByUser[email][5];
      const deadlineInOneDay = tasksByUser[email][1];
      if (deadlineInfiveDay && deadlineInfiveDay[0].notifiedFiveDaysBefore === false) {
        const upcomingTasksList = buildUpcomingTasksList(tasksByUser[email]);
        await sendDeadlineNotification(email, upcomingTasksList, 5);
        await Task.updateMany(
          { _id: { $in: deadlineInfiveDay.map((task) => task._id) } },
          { $set: { notifiedFiveDaysBefore: true } }
        );
      }

      if (deadlineInOneDay && deadlineInOneDay[0].notifiedOneDayBefore === false) {
        const upcomingTasksList = buildUpcomingTasksList(tasksByUser[email]);
        await sendDeadlineNotification(email, upcomingTasksList, 1);
        await Task.updateMany(
          { _id: { $in: deadlineInOneDay.map((task) => task._id) } },
          { $set: { notifiedOneDayBefore: true } }
        );
      }
    }
  }
};

const sendDeadlineNotification = async (email, upcomingTasksList) => {
  const message = `⚠️ შესასრულებელი დავალებების ვადა იწურება! ⚠️ \n${upcomingTasksList}`; // Clear and informative message

  try {
    await sendEmail({
      email,
      subject: "⚠️ დავალებების ვადა იწურება ",
      message,
    });
  } catch (error) {
    throw new AppError(error, 500);
  }
};

const initializeTaskReminderService = async () => {
  const timezone = "Asia/Tbilisi"; // or any other timezone
  const scheduleTime = moment.tz(timezone).startOf("day").add(7, "hours");
  // for testing
  // const scheduleTime = "*/5 * * * * *"; // every second
  schedule.scheduleJob(scheduleTime, async () => {
    await checkTaskDeadlines();
  });
};

module.exports = initializeTaskReminderService;

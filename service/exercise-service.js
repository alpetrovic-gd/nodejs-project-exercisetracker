import { AppError } from "../error/app-error.js";
import { create } from "../repository/excercise-repository.js";
import { isDateInValidFormat } from "../util/date-validation.js";
import { get } from "../repository/user-repository.js";

export async function createExercise(_id, description, duration, date) {
  if (!description) {
    throw new AppError(400, "Description is missing, but is required");
  }
  if (description.trim().length === 0) {
    throw new AppError(422, "Description cannot be empty");
  }

  if (!duration) {
    throw new AppError(400, "Duration is missing, but is required");
  }
  if (isNaN(parseInt(duration)) || duration <= 0) {
    throw new AppError(422, "Duration must be a number greater than 0");
  }

  if (date) {
    date = date.trim();
    if (!isDateInValidFormat(date)) {
      throw new AppError(
        400,
        "Invalid 'date' date format. Expected YYYY-MM-DD",
      );
    }
  }
  const dateObj = date ? new Date(date) : new Date();
  const dateString = dateObj.toISOString().split("T")[0];

  try {
    const user = await get(_id);

    if (!user) {
      throw new AppError(404, "User with the given ID not found");
    }

    await create(_id, description.trim(), parseInt(duration), dateString);

    return {
      username: user.username,
      description: description.trim(),
      duration: parseInt(duration),
      date: dateString,
      _id,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw new AppError(error.statusCode, error.message);
    } else {
      throw new AppError(500, "Database error. " + error.message);
    }
  }
}

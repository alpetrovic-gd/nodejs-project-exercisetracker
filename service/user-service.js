import { AppError } from "../error/app-error.js";
import { create, get, getAll, getLogs } from "../repository/user-repository.js";
import { isDateInValidFormat } from "../util/date-validation.js";

export async function createUser(username) {
  if (!username) {
    throw new AppError(400, "Username is missing, but is required");
  } else if (username.trim().length === 0) {
    throw new AppError(422, "Username cannot be empty");
  }

  try {
    return await create(username);
  } catch (error) {
    if (
      error.code === "SQLITE_CONSTRAINT" &&
      error.message.includes("UNIQUE")
    ) {
      throw new AppError(422, "Username already exists");
    } else {
      throw new AppError(500, "Database error. " + error.message);
    }
  }
}

export async function getAllUsers() {
  try {
    return await getAll();
  } catch (error) {
    throw new AppError(500, "Database error. " + error.message);
  }
}

export async function getUserLogs(_id, from, to, limit) {
  if (from) {
    from = from.trim();
    if (!isDateInValidFormat(from)) {
      throw new AppError(
        400,
        "Invalid 'from' date format. Expected YYYY-MM-DD",
      );
    }
  }

  if (to) {
    to = to.trim();
    if (!isDateInValidFormat(to)) {
      throw new AppError(400, "Invalid 'to' date format. Expected YYYY-MM-DD");
    }
  }

  if (limit) {
    limit = limit.trim();
    const parsedLimit = parseInt(limit);
    if (isNaN(parsedLimit) || parsedLimit < 0) {
      throw new AppError(
        400,
        "Limit must be a number greater than or equal to 0",
      );
    }
  }

  try {
    const user = await get(_id);

    if (!user) {
      throw new AppError(404, "User with the given ID not found");
    }

    const { count, exercises } = await getLogs(_id, from, to, limit);

    return {
      username: user.username,
      count: count,
      _id,
      log: exercises,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw new AppError(error.statusCode, error.message);
    } else {
      throw new AppError(500, "Database error. " + error.message);
    }
  }
}

import { ApiError } from "../utils/ApiError.js";

const validate = (schema) => async (req, res, next) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return next();
  } catch (error) {
    const errorMessages = error.errors.map((err) => ({
      [err.path.join(".")]: err.message,
    }));
    return next(new ApiError(422, "Received data is not valid!", errorMessages));
  }
};

export { validate };

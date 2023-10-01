class BaseError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  };
};

class InvalidArgument extends BaseError {};

class EvaluationError extends BaseError {};

module.exports = { InvalidArgument, EvaluationError };
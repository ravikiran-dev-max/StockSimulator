export const validatePrice = (req, res, next) => {
  const { price } = req.body;

  if (price === undefined || price === null || price === '') {
    res.status(400);
    return next(new Error('Price is required'));
  }

  const numericPrice = Number(price);

  if (isNaN(numericPrice)) {
    res.status(400);
    return next(new Error('Price must be a valid number'));
  }

  if (numericPrice <= 0) {
    res.status(400);
    return next(new Error('Price must be a positive number greater than 0'));
  }

  req.body.price = numericPrice;
  next();
};

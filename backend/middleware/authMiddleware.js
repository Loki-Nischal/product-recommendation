export const protect = (req, res, next) => {
  // Temporary middleware (bypass for now)
  console.log("Auth middleware hit");
  next();
};

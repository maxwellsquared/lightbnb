// const properties = require('./json/properties.json');
// const users = require('./json/users.json');
const { Pool } = require('pg');

// connect to database
const pool = new Pool({
  user: 'max',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */


// tristanjacobs@gmail.com / password

const getUserWithEmail = (email) => {
  return pool
    .query(`SELECT * FROM users WHERE email=$1`, [email])
    .then((result) => {
      console.log("USER", result.rows);
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getUserWithEmail = getUserWithEmail;


/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
// const getUserWithId = function(id) {
//   return Promise.resolve(users[id]);
// }

const getUserWithId = (id) => {
  return pool
    .query(`SELECT * FROM users WHERE users.id=$1`, [id])
    .then((result) => {
      console.log(result.rows);
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};

exports.getUserWithId = getUserWithId;




/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
// const addUser =  function(user) {
//   const userId = Object.keys(users).length + 1;
//   user.id = userId;
//   users[userId] = user;
//   return Promise.resolve(user);
// }

const addUser = function(newUser) {
  return pool
    .query(`INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *;`, [newUser.name, newUser.email, newUser.password])
    .then((result) => {
      console.log(result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    })
};


exports.addUser = addUser;

/// Reservations

// test user: muhammadwebb@hotmail.com / password

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
// const getAllReservations = function(guest_id, limit = 10) {
//   return getAllProperties(null, 2);
// }
const getAllReservations = function(guest_id) {
  const myQuery = `
    SELECT reservations.*, properties.title, properties.cost_per_night, avg(rating) as average_rating
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    JOIN property_reviews ON properties.id = property_reviews.property_id
    WHERE reservations.guest_id = $1
    GROUP BY properties.id, reservations.id
    ORDER BY reservations.start_date
    LIMIT 10;
  `;
  return pool
  .query(myQuery, [guest_id])
  .then((result) => {
    console.log(result.rows);
    return result.rows;
  })
  .catch((err) => {
    console.log(err.message);
  })


};

exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */

 const getAllProperties = function (options, limit = 10) {
  // Setup an array to hold any parameters that may be available
  const queryParams = [];
  // Start the query with all information that comes before the WHERE clause.
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  // Check if a city has been passed in as an option.
  // Add the city to the params array and create a WHERE clause for the city.
  if (options.city || options.owner_id || options.minimum_price_per_night || options.maximum_price_per_night) {
    queryString += `WHERE`;
  }

  if (options.city) {
    if (queryParams.length !== 0) queryString += `AND`;

    // The % syntax for the LIKE clause must be part of the parameter, not the query.
    queryParams.push(`%${options.city}%`);
    // We can use the length of the array to dynamically get the $n
    // placeholder number. Since this is the first parameter, it will be $1.

    queryString += ` city LIKE $${queryParams.length} `;
  }

  if (options.owner_id) {
    if (queryParams.length !== 0) queryString += `AND`;
    queryParams.push(`${options.owner_id}`);
    queryString += ` owner_id = $${queryParams.length} `;
  }

  if (options.minimum_price_per_night) {
    if (queryParams.length !== 0) queryString += `AND`;
    queryParams.push(`${100 * options.minimum_price_per_night}`);
    queryString += ` cost_per_night >= $${queryParams.length} `;
  }

  if (options.maximum_price_per_night) {
    if (queryParams.length !== 0) queryString += `AND`;
    queryParams.push(`${100 * options.maximum_price_per_night}`);
    queryString += ` cost_per_night <= $${queryParams.length} `;
  }

  // Add any query that comes after the WHERE clause.



  queryString += `
  GROUP BY properties.id`;
  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    queryString += ` HAVING avg(property_reviews.rating) >= $${queryParams.length} `;
  }

  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;



  // Console log everything just to make sure we've done it right.
  console.log(queryString, queryParams);

  // Run the query.
  return pool.query(queryString, queryParams).then((res) => res.rows);
};

exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
}
exports.addProperty = addProperty;

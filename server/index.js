const pg = require("pg");
const client = new pg.Client(
  process.env.DATABASE_URL ||
    "postgres://jennaallnock:8487@localhost:3000/acme_icecream"
);
const express = require("express");
const app = express();

app.use(express.json());
app.use(require("morgan")("dev"));

app.post("/api/flavors", async (req, res, next) => {
  try {
    const SQL = `
      INSERT INTO flavors(name, is_favorite)
      VALUES($1, $2)
      RETURNING *
    `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.is_favorite,
    ]);
    res.send(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/flavors", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM flavors ORDER BY created_at DESC;`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM flavors WHERE id = $1;`;
    const response = await client.query(SQL, [req.params.id]);
    if (response.rows.length) {
      res.send(response.rows[0]);
    } else {
      res.status(404).send("Flavor not found");
    }
  } catch (ex) {
    next(ex);
  }
});

app.put("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `
      UPDATE flavors
      SET name = $1, is_favorite = $2, updated_at = now()
      WHERE id = $3
      RETURNING *
    `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.is_favorite,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

app.delete("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `DELETE FROM flavors WHERE id = $1;`;
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (ex) {
    next(ex);
  }
});

const init = async () => {
  await client.connect();
  let SQL = `
    DROP TABLE IF EXISTS flavors;
    CREATE TABLE flavors(
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      is_favorite BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );
  `;
  await client.query(SQL);
  console.log("Tables created");

  SQL = `
    INSERT INTO flavors(name, is_favorite) VALUES('Vanilla', true);
    INSERT INTO flavors(name, is_favorite) VALUES('Chocolate', false);
    INSERT INTO flavors(name, is_favorite) VALUES('Strawberry', false);
  `;
  await client.query(SQL);
  console.log("Data seeded");

  const port = process.env.PORT || 3002;
  app.listen(port, () => console.log(`Listening on port ${port}`));
};

init();

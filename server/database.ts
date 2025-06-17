import { drizzle } from "drizzle-orm/postgres-js";
import { drizzle as drizzleMysql } from "drizzle-orm/mysql2";
import postgres from "postgres";
import mysql from "mysql2/promise";
import * as schema from "../shared/schema.js";

// Database type from environment
const DB_TYPE = process.env.DB_TYPE || "postgresql";

// Database connection configuration
let db: any;

export function initializeDatabase() {
  if (DB_TYPE === "mysql") {
    // MySQL configuration
    const connection = mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "3306"),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "service_management",
    });
    
    db = drizzleMysql(connection, { schema, mode: "default" });
  } else {
    // PostgreSQL configuration (default)
    const connectionString = process.env.DATABASE_URL || 
      `postgresql://${process.env.DB_USER || "postgres"}:${process.env.DB_PASSWORD || ""}@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "5432"}/${process.env.DB_NAME || "service_management"}`;
    
    const client = postgres(connectionString);
    db = drizzle(client, { schema });
  }
  
  return db;
}

export function getDatabase() {
  if (!db) {
    return initializeDatabase();
  }
  return db;
}
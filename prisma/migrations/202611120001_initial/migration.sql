-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "preferences" TEXT NOT NULL DEFAULT '{}'
);

-- CreateTable
CREATE TABLE "Map" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Map_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Obstacle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mapId" INTEGER NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    CONSTRAINT "Obstacle_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Waypoint" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mapId" INTEGER NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    CONSTRAINT "Waypoint_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Route" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mapId" INTEGER NOT NULL,
    "startX" INTEGER NOT NULL,
    "startY" INTEGER NOT NULL,
    "endX" INTEGER NOT NULL,
    "endY" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "distance" INTEGER NOT NULL,
    "visitedCount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Route_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Obstacle_mapId_x_y_key" ON "Obstacle"("mapId", "x", "y");

-- CreateIndex
CREATE UNIQUE INDEX "Waypoint_mapId_position_key" ON "Waypoint"("mapId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Waypoint_mapId_x_y_key" ON "Waypoint"("mapId", "x", "y");


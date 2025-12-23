-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 23, 2025 at 06:45 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `siajapun`
--

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `id` int(11) NOT NULL,
  `wasteType` varchar(255) DEFAULT NULL,
  `locationType` varchar(255) DEFAULT NULL,
  `severity` varchar(100) DEFAULT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `reportedBy` varchar(255) DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `cleaned` tinyint(1) DEFAULT 0,
  `timestamp` datetime DEFAULT current_timestamp(),
  `cleanedDate` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reports`
--

INSERT INTO `reports` (`id`, `wasteType`, `locationType`, `severity`, `latitude`, `longitude`, `notes`, `reportedBy`, `photo`, `cleaned`, `timestamp`, `cleanedDate`) VALUES
(30, 'Plastic', 'Land', 'Moderate', 10.305119, 123.963966, 'Plastic Waste', 'client', '1766467125_images.png', 0, '2025-12-23 13:18:45', NULL),
(31, 'Glass', 'Water', 'Moderate', 10.312893, 123.940802, 'Glass waste', 'client', '1766467257_images.png', 0, '2025-12-23 13:20:57', NULL),
(32, 'Metal', 'Land', 'Low', 10.309346, 123.923635, 'Metal Waste', 'client', '1766467336_injap.webp', 0, '2025-12-23 13:22:16', NULL),
(33, 'Paper', 'Land', 'Moderate', 10.31171, 123.907499, 'Paper Waste', 'client', '1766467363_Pm1.webp', 0, '2025-12-23 13:22:43', NULL),
(34, 'Organic', 'Land', 'Low', 10.329443, 123.955221, 'Organic Waste', 'client', '1766467407_zoom-background-aacq3p3puzx0b9ra.jpg', 0, '2025-12-23 13:23:27', NULL),
(35, 'Electronic', 'Land', 'Low', 10.325728, 123.948097, 'Electronic Waste\\r\\n', 'client', '1766467489_coco.jpg', 0, '2025-12-23 13:24:49', NULL),
(36, 'Mixed', 'Water', 'Moderate', 10.333834, 123.998222, 'Mixed Waste', 'client', '1766467522_coco.jpg', 0, '2025-12-23 13:25:22', NULL),
(37, 'Plastic', 'Water', 'Moderate', 10.335185, 123.965092, 'More Plastic', 'client', '1766467569_injap.webp', 0, '2025-12-23 13:26:09', NULL),
(38, 'Metal', 'Land', 'Low', 10.340674, 123.967366, 'Metal are scattering in the road', 'client', '1766467607_manten.png', 0, '2025-12-23 13:26:47', NULL),
(39, 'Glass', 'Land', 'Moderate', 10.34346, 123.960671, 'Broken Glass are blocking in the road', 'client', '1766467683_Pm1.webp', 0, '2025-12-23 13:28:03', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` enum('admin','client') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `role`) VALUES
(1, 'admin', '0192023a7bbd73250516f069df18b500', 'admin'),
(2, 'client', '3677b23baa08f74c28aba07f0cb6554e', 'client');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `reports`
--
ALTER TABLE `reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

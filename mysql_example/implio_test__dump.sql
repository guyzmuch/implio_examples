-- phpMyAdmin SQL Dump
-- version 4.2.5
-- http://www.phpmyadmin.net
--
-- Host: localhost:8889
-- Generation Time: May 12, 2016 at 11:01 AM
-- Server version: 5.5.38
-- PHP Version: 5.5.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

--
-- Database: `implio_test`
--
CREATE DATABASE IF NOT EXISTS `implio_test` DEFAULT CHARACTER SET utf8 COLLATE utf8_swedish_ci;
USE `implio_test`;

-- --------------------------------------------------------

--
-- Table structure for table `my_ads`
--

CREATE TABLE `my_ads` (
`id` int(11) NOT NULL,
  `insertion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `title` varchar(250) CHARACTER SET utf8 COLLATE utf8_swedish_ci NOT NULL,
  `body` text CHARACTER SET utf8 COLLATE utf8_swedish_ci NOT NULL,
  `implio_treated` int(11) NOT NULL DEFAULT '0',
  `time_retrieved` datetime DEFAULT NULL,
  `decision` varchar(200) CHARACTER SET utf8 COLLATE utf8_swedish_ci DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=5 ;

--
-- Dumping data for table `my_ads`
--

INSERT INTO `my_ads` (`id`, `insertion`, `title`, `body`, `implio_treated`, `time_retrieved`, `decision`) VALUES
(1, '2016-04-01 08:32:00', 'Hello world!', 'Ahoy!!', 0, NULL, NULL),
(2, '2016-05-01 05:26:31', 'First ads', 'this is the first ad posted for this site', 0, NULL, NULL),
(3, '2016-05-02 11:17:25', 'Second ads', 'It is about time somebody post something else', 0, NULL, NULL),
(4, '2016-05-02 22:00:00', 'how to contact support', 'Nobody answered my first request', 0, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `my_ads`
--
ALTER TABLE `my_ads`
 ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `my_ads`
--
ALTER TABLE `my_ads`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=5;
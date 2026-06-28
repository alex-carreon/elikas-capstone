/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-11.7.2-MariaDB, for Win64 (AMD64)
--
-- Host: localhost       Database: elikas_db
-- ------------------------------------------------------
-- Server version	10.11.14-MariaDB-0+deb12u2

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `Admins`
--

DROP TABLE IF EXISTS `Admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `Admins_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `AuditLogs`
--

DROP TABLE IF EXISTS `AuditLogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `AuditLogs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_type` varchar(255) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `event` varchar(255) NOT NULL,
  `target_id` int(11) NOT NULL,
  `old_values` text DEFAULT NULL,
  `new_values` text DEFAULT NULL,
  `target_table_id` int(11) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(1023) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `log_id` varchar(10) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `AuditLogs_UNIQUE` (`log_id`),
  KEY `auditlogs_user_id_user_type_index` (`user_id`,`user_type`),
  KEY `AuditLogs_TargetTables_FK` (`target_table_id`),
  CONSTRAINT `AuditLogs_TargetTables_FK` FOREIGN KEY (`target_table_id`) REFERENCES `TargetTables` (`id`),
  CONSTRAINT `AuditLogs_Users_FK` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=558 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 */ /*!50003 TRIGGER generate_audit_log_id
BEFORE INSERT
ON AuditLogs FOR EACH ROW

BEGIN
    DECLARE event_letter CHAR(1);
    DECLARE random_suffix VARCHAR(6);

    -- 1. Determine the prefix letter based on the event column
    IF NEW.event = 'created' THEN 
        SET event_letter = 'C';
    ELSEIF NEW.event = 'updated' THEN 
        SET event_letter = 'U';
    ELSEIF NEW.event = 'deleted' THEN 
        SET event_letter = 'D';
    ELSE 
        SET event_letter = 'A'; -- Fallback for generic events
    END IF;

    -- 2. Generate an 6-character random hex string from a UUID
    -- (We replace dashes and take characters 1 to 8)
    SET random_suffix = UPPER(SUBSTRING(REPLACE(UUID(), '-', ''), 1, 6));

    -- 3. Concatenate and assign to the column (replace 'audit_id' with your actual column name)
    SET NEW.log_id = CONCAT(event_letter, random_suffix);
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `BroadcastStatus`
--

DROP TABLE IF EXISTS `BroadcastStatus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `BroadcastStatus` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `status_name` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `status_name` (`status_name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `CapacityLevels`
--

DROP TABLE IF EXISTS `CapacityLevels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `CapacityLevels` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `capacity_level` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `capacity_level` (`capacity_level`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Comments`
--

DROP TABLE IF EXISTS `Comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `element_id` int(11) NOT NULL,
  `parent_id` int(11) NOT NULL,
  `content` text DEFAULT NULL,
  `upvotes` int(11) NOT NULL DEFAULT 0,
  `downvotes` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `element_id` (`element_id`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `Comments_ibfk_1` FOREIGN KEY (`element_id`) REFERENCES `SocialElements` (`id`),
  CONSTRAINT `Comments_ibfk_2` FOREIGN KEY (`parent_id`) REFERENCES `SocialElements` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `EmergencyContacts`
--

DROP TABLE IF EXISTS `EmergencyContacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `EmergencyContacts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `element_id` int(11) NOT NULL,
  `location_id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `phone_number` varchar(15) DEFAULT NULL,
  `mobile_number` varchar(15) DEFAULT NULL,
  `address` text NOT NULL,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `element_id` (`element_id`),
  KEY `location_id` (`location_id`),
  CONSTRAINT `EmergencyContacts_ibfk_1` FOREIGN KEY (`element_id`) REFERENCES `SocialElements` (`id`),
  CONSTRAINT `EmergencyContacts_ibfk_2` FOREIGN KEY (`location_id`) REFERENCES `Locations` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `EvacAreas`
--

DROP TABLE IF EXISTS `EvacAreas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `EvacAreas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `element_id` int(11) NOT NULL,
  `location_id` int(11) NOT NULL,
  `location` point NOT NULL,
  `area_type` int(11) NOT NULL,
  `address` text NOT NULL,
  `description` text DEFAULT NULL,
  `name` varchar(50) NOT NULL,
  `capacity_level` int(11) NOT NULL,
  `last_updated` datetime DEFAULT NULL,
  `is_persistent` tinyint(1) NOT NULL DEFAULT 0,
  `verified_by` int(11) DEFAULT NULL,
  `for_reg_flood` tinyint(1) DEFAULT NULL,
  `for_heavy_flood` tinyint(1) DEFAULT NULL,
  `has_accom` tinyint(1) DEFAULT NULL,
  `toilet_count` int(11) DEFAULT NULL,
  `kitchen_count` int(11) DEFAULT NULL,
  `has_DRRMO` tinyint(1) DEFAULT NULL,
  `has_health` tinyint(1) DEFAULT NULL,
  `pwd_friendly` tinyint(1) DEFAULT NULL,
  `has_catchment` tinyint(1) DEFAULT NULL,
  `child_prayer_count` int(11) DEFAULT NULL,
  `breastfeed_count` int(11) DEFAULT NULL,
  `other_facilities` text DEFAULT NULL,
  `contact_person` varchar(100) DEFAULT NULL,
  `contact_number` varchar(15) DEFAULT NULL,
  `expiry` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `element_id` (`element_id`),
  KEY `location_id` (`location_id`),
  KEY `area_type` (`area_type`),
  KEY `capacity_level` (`capacity_level`),
  KEY `verified_by` (`verified_by`),
  CONSTRAINT `EvacAreas_ibfk_1` FOREIGN KEY (`element_id`) REFERENCES `SocialElements` (`id`),
  CONSTRAINT `EvacAreas_ibfk_2` FOREIGN KEY (`location_id`) REFERENCES `Locations` (`id`),
  CONSTRAINT `EvacAreas_ibfk_3` FOREIGN KEY (`area_type`) REFERENCES `EvacTypes` (`id`),
  CONSTRAINT `EvacAreas_ibfk_4` FOREIGN KEY (`capacity_level`) REFERENCES `CapacityLevels` (`id`),
  CONSTRAINT `EvacAreas_ibfk_5` FOREIGN KEY (`verified_by`) REFERENCES `GovOps` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `EvacTypes`
--

DROP TABLE IF EXISTS `EvacTypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `EvacTypes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `evac_type` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `evac_type` (`evac_type`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Feedback`
--

DROP TABLE IF EXISTS `Feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Feedback` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `sent_at` datetime NOT NULL DEFAULT current_timestamp(),
  `rating` decimal(2,1) NOT NULL,
  `message` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `Feedback_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `FlagReasons`
--

DROP TABLE IF EXISTS `FlagReasons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `FlagReasons` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `reason_label` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reason_label` (`reason_label`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Flags`
--

DROP TABLE IF EXISTS `Flags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Flags` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `element_id` int(11) NOT NULL,
  `reason_id` int(11) NOT NULL,
  `flagged_at` datetime NOT NULL DEFAULT current_timestamp(),
  `is_approved` tinyint(1) DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `element_id` (`element_id`),
  KEY `reason_id` (`reason_id`),
  KEY `reviewed_by` (`reviewed_by`),
  CONSTRAINT `Flags_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`),
  CONSTRAINT `Flags_ibfk_2` FOREIGN KEY (`element_id`) REFERENCES `SocialElements` (`id`),
  CONSTRAINT `Flags_ibfk_3` FOREIGN KEY (`reason_id`) REFERENCES `FlagReasons` (`id`),
  CONSTRAINT `Flags_ibfk_4` FOREIGN KEY (`reviewed_by`) REFERENCES `Admins` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `FloodLevels`
--

DROP TABLE IF EXISTS `FloodLevels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `FloodLevels` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `level_name` varchar(20) NOT NULL,
  `description` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `level_name` (`level_name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `FloodPaths`
--

DROP TABLE IF EXISTS `FloodPaths`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `FloodPaths` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `element_id` int(11) NOT NULL,
  `level_id` int(11) NOT NULL,
  `last_confirmed` datetime NOT NULL DEFAULT current_timestamp(),
  `path` linestring NOT NULL,
  `description` text DEFAULT NULL,
  `upvotes` int(11) NOT NULL DEFAULT 0,
  `downvotes` int(11) NOT NULL DEFAULT 0,
  `expiry` datetime NOT NULL,
  `reminder_sent_at` datetime DEFAULT NULL,
  `dismissed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `element_id` (`element_id`),
  KEY `level_id` (`level_id`),
  SPATIAL KEY `idx_flood_path` (`path`),
  CONSTRAINT `FloodPaths_ibfk_1` FOREIGN KEY (`element_id`) REFERENCES `SocialElements` (`id`),
  CONSTRAINT `FloodPaths_ibfk_2` FOREIGN KEY (`level_id`) REFERENCES `FloodLevels` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=91 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `GovOps`
--

DROP TABLE IF EXISTS `GovOps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `GovOps` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `level_id` int(11) NOT NULL,
  `location_id` int(11) NOT NULL,
  `point_person` varchar(100) DEFAULT NULL,
  `point_position` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `level_id` (`level_id`),
  KEY `location_id` (`location_id`),
  CONSTRAINT `GovOps_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`),
  CONSTRAINT `GovOps_ibfk_2` FOREIGN KEY (`level_id`) REFERENCES `LocationLevels` (`id`),
  CONSTRAINT `GovOps_ibfk_3` FOREIGN KEY (`location_id`) REFERENCES `Locations` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `IndivAccs`
--

DROP TABLE IF EXISTS `IndivAccs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `IndivAccs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `location_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `location_id` (`location_id`),
  CONSTRAINT `IndivAccs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`),
  CONSTRAINT `IndivAccs_ibfk_2` FOREIGN KEY (`location_id`) REFERENCES `Locations` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=106 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `LocationLevels`
--

DROP TABLE IF EXISTS `LocationLevels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `LocationLevels` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `level_name` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `level_name` (`level_name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Locations`
--

DROP TABLE IF EXISTS `Locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Locations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `level_id` int(11) NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `level_id` (`level_id`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `Locations_ibfk_1` FOREIGN KEY (`level_id`) REFERENCES `LocationLevels` (`id`),
  CONSTRAINT `Locations_ibfk_2` FOREIGN KEY (`parent_id`) REFERENCES `Locations` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Media`
--

DROP TABLE IF EXISTS `Media`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Media` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `parent_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_type` varchar(20) NOT NULL,
  `uploaded_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `parent_id` (`parent_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `Media_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `SocialElements` (`id`),
  CONSTRAINT `Media_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=83 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ModerationLogs`
--

DROP TABLE IF EXISTS `ModerationLogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ModerationLogs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `element_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `is_approved` tinyint(1) DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `element_id` (`element_id`),
  KEY `reviewed_by` (`reviewed_by`),
  CONSTRAINT `ModerationLogs_ibfk_1` FOREIGN KEY (`element_id`) REFERENCES `SocialElements` (`id`),
  CONSTRAINT `ModerationLogs_ibfk_2` FOREIGN KEY (`reviewed_by`) REFERENCES `Admins` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Names`
--

DROP TABLE IF EXISTS `Names`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Names` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `Names_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=107 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `PhoneNumbers`
--

DROP TABLE IF EXISTS `PhoneNumbers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `PhoneNumbers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `phone_no` varchar(15) NOT NULL,
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `PhoneNumbers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Roles`
--

DROP TABLE IF EXISTS `Roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_name` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `SMSBroadcasts`
--

DROP TABLE IF EXISTS `SMSBroadcasts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `SMSBroadcasts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sender_id` int(11) NOT NULL,
  `location_id` int(11) NOT NULL,
  `message_content` text NOT NULL,
  `status` int(11) NOT NULL,
  `scheduled_for` datetime NOT NULL DEFAULT current_timestamp(),
  `sent_at` datetime DEFAULT NULL,
  `total_recipients` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sender_id` (`sender_id`),
  KEY `location_id` (`location_id`),
  KEY `status` (`status`),
  CONSTRAINT `SMSBroadcasts_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `GovOps` (`id`),
  CONSTRAINT `SMSBroadcasts_ibfk_2` FOREIGN KEY (`location_id`) REFERENCES `Locations` (`id`),
  CONSTRAINT `SMSBroadcasts_ibfk_3` FOREIGN KEY (`status`) REFERENCES `BroadcastStatus` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `SMSTemplates`
--

DROP TABLE IF EXISTS `SMSTemplates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `SMSTemplates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `optr_id` int(11) NOT NULL,
  `template_name` varchar(50) NOT NULL,
  `message_content` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `template_name` (`template_name`),
  KEY `optr_id` (`optr_id`),
  CONSTRAINT `SMSTemplates_ibfk_1` FOREIGN KEY (`optr_id`) REFERENCES `GovOps` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `SensorLogs`
--

DROP TABLE IF EXISTS `SensorLogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `SensorLogs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sensor_code` varchar(20) NOT NULL,
  `sensor_timestamp` datetime NOT NULL,
  `log_time` datetime NOT NULL DEFAULT current_timestamp(),
  `water_level` decimal(6,2) NOT NULL,
  `status_level` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sensor_id` (`sensor_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Sensors`
--

DROP TABLE IF EXISTS `Sensors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Sensors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `element_id` int(11) NOT NULL,
  `sensor_code` varchar(20) NOT NULL DEFAULT concat('SR-',ucase(substr(replace(uuid(),'-',''),1,6))),
  `mount_height` decimal(4,2) NOT NULL,
  `name` varchar(50) NOT NULL,
  `location` point NOT NULL,
  `address` text NOT NULL,
  `last_online` datetime DEFAULT NULL,
  `location_id` int(11) NOT NULL,
  `yellow_level` decimal(4,2) NOT NULL,
  `orange_level` decimal(4,2) NOT NULL,
  `red_level` decimal(4,2) NOT NULL,
  `current_status` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Sensors_UNIQUE` (`sensor_code`),
  KEY `element_id` (`element_id`),
  CONSTRAINT `Sensors_Locations_FK` FOREIGN KEY (`id`) REFERENCES `Locations` (`id`),
  CONSTRAINT `Sensors_ibfk_1` FOREIGN KEY (`element_id`) REFERENCES `SocialElements` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `SocialElements`
--

DROP TABLE IF EXISTS `SocialElements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `SocialElements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `posted_at` datetime NOT NULL DEFAULT current_timestamp(),
  `type_id` int(11) NOT NULL,
  `has_media` tinyint(1) NOT NULL DEFAULT 0,
  `deactivated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `type_id` (`type_id`),
  CONSTRAINT `SocialElements_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`),
  CONSTRAINT `SocialElements_ibfk_2` FOREIGN KEY (`type_id`) REFERENCES `TargetTables` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=220 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `TargetTables`
--

DROP TABLE IF EXISTS `TargetTables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `TargetTables` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `table_name` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `table_name` (`table_name`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `UserAuth`
--

DROP TABLE IF EXISTS `UserAuth`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserAuth` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `identity_uid` varchar(128) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `identity_uid` (`identity_uid`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `UserAuth_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=117 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Users`
--

DROP TABLE IF EXISTS `Users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(20) NOT NULL,
  `email` varchar(50) NOT NULL,
  `role_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `deactivated_at` datetime DEFAULT NULL,
  `avatar_seed` char(8) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `Users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `Roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=116 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Votes`
--

DROP TABLE IF EXISTS `Votes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Votes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `element_id` int(11) NOT NULL,
  `vote` tinyint(4) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `element_id` (`element_id`),
  CONSTRAINT `Votes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`),
  CONSTRAINT `Votes_ibfk_2` FOREIGN KEY (`element_id`) REFERENCES `SocialElements` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` smallint(5) unsigned NOT NULL,
  `reserved_at` int(10) unsigned DEFAULT NULL,
  `available_at` int(10) unsigned NOT NULL,
  `created_at` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'elikas_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-06-29  2:23:42

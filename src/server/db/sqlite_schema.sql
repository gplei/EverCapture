CREATE TABLE `ec_crumb` ( 
    `id` integer NOT NULL PRIMARY KEY AUTOINCREMENT , 
    `user_id` integer NOT NULL , 
    `date` datetime DEFAULT current_timestamp , 
    `title` varchar(100) NOT NULL , 
    `description` mediumtext , 
    `url` text , 
    `pin` integer NOT NULL DEFAULT '0' , 
    `color` varchar(10) DEFAULT NULL , 
    `deleted` integer NOT NULL DEFAULT '0' , 
    `created_at` datetime DEFAULT current_timestamp , 
    `updated_at` datetime DEFAULT current_timestamp , CONSTRAINT 
    `ec_crumb_ibfk_1` 
    FOREIGN KEY (`user_id`) REFERENCES `ec_user` (`id`) ON DELETE CASCADE , 
    CONSTRAINT `ec_crumb_chk_1` CHECK ((`pin` in (0,1))) 
);

CREATE TABLE `ec_crumb_tag` ( 
    `id` integer NOT NULL PRIMARY KEY AUTOINCREMENT , 
    `crumb_id` integer NOT NULL , 
    `tag_id` integer NOT NULL , 
    UNIQUE (`crumb_id`,`tag_id`) , 
    CONSTRAINT `ec_crumb_tag_ibfk_1` FOREIGN KEY (`crumb_id`) REFERENCES `ec_crumb` (`id`) ON DELETE CASCADE , 
    CONSTRAINT `ec_crumb_tag_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `ec_tag` (`id`) ON DELETE CASCADE 
);

CREATE TABLE ec_image ( 
    `id` INTEGER PRIMARY KEY AUTOINCREMENT, 
    `crumb_id` INTEGER NOT NULL, 
    `image_url` TEXT NOT NULL, 
    FOREIGN KEY (`crumb_id`) REFERENCES `ec_crumb` (`id`) ON DELETE CASCADE 
);

CREATE TABLE `ec_tag` ( 
    `id` integer NOT NULL PRIMARY KEY AUTOINCREMENT , 
    `tag_name` varchar(255) NOT NULL , 
    `created_at` datetime DEFAULT current_timestamp , 
    UNIQUE (`tag_name`) 
);

CREATE TABLE `ec_user` ( 
    `id` integer NOT NULL PRIMARY KEY AUTOINCREMENT , 
    `username` varchar(256) DEFAULT NULL , 
    `password` varchar(256) DEFAULT NULL , 
    `email` varchar(128) DEFAULT NULL , 
    `active` integer NOT NULL DEFAULT '1' , 
    `created_at` datetime DEFAULT current_timestamp , 
    UNIQUE (`username`) , 
    CONSTRAINT `ec_user_chk_1` 
    CHECK ((`active` in (0,1))) 
);


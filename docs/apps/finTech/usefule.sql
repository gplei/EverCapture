alter table transaction_log drop column category;


SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE fintech;

USE fintech;

CREATE TABLE asset_name (
    id INT AUTO_INCREMENT PRIMARY KEY,
    symbol VARCHAR(255) NOT NULL UNIQUE,
    company_name VARCHAR(255),
    price DECIMAL(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE trade_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    symbol_id INT NOT NULL,  -- Stock ticker symbol (e.g., AAPL, TSLA)
    trade_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Trade timestamp
    trade_type ENUM('BUY', 'SELL') NOT NULL, -- Trade direction
    quantity INT NOT NULL CHECK (quantity > 0), -- Number of shares traded
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0), -- Trade price per share
    total DECIMAL(12,2) GENERATED ALWAYS AS (
        CASE 
            WHEN trade_type = 'BUY' THEN - (quantity * price)
            ELSE (quantity * price)
        END
    ) STORED,
    FOREIGN KEY (symbol_id) REFERENCES fin_symbol(id) ON DELETE CASCADE
);

CREATE TABLE transaction_log (
  id INT AUTO_INCREMENT PRIMARY KEY,  -- Unique ID for each purchase
  purchase_date DATE NOT NULL,                 -- The date of the purchase
  item VARCHAR(100) NOT NULL,                            -- Optional description or notes about the purchase
  price DECIMAL(10, 2) NOT NULL,               -- The price of the item (supports decimals like 10.99)
  category_id INT ,
  item_description TEXT,                            -- Optional description or notes about the purchase
  store_name VARCHAR(255),            -- Name of the store where the purchase was made
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Timestamp of when the log was created
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- Timestamp for last update
);
CREATE TABLE transaction_detail_log (
  id INT AUTO_INCREMENT PRIMARY KEY,  -- Unique ID for each purchase
  transaction_id INT NOT NULL,
  item VARCHAR(100) NOT NULL,                            -- Optional description or notes about the purchase
  price DECIMAL(10, 2) NOT NULL,               -- The price of the item (supports decimals like 10.99)
  category_id INT NOT NULL,
  FOREIGN KEY (category_id) REFERENCES category(id),
  FOREIGN KEY (transaction_id) REFERENCES transaction_log(id)
);
/*
    misc sql
*/
insert into transaction_log (purchase_date, price, store_name) select STR_TO_DATE(date, '%m/%d/%Y'), debit, description from citi_transaction where debit > 0;
insert into transaction_log (purchase_date, price, store_name) select STR_TO_DATE(date, '%m/%d/%Y'), credit, description from citi_transaction where credit < 0;
ALTER TABLE transaction_log MODIFY COLUMN category ENUM(
    'Food', -- Groceries, snacks, drinks, dining out
    'Dining Out',
    'Clothing',
    'Household Items', -- Furniture, cleaning supplies, bedding, decor
    'Health & Wellness', -- Medicine, vitamins, fitness, wellness products
    'Housing', -- mortgage/rent, utilities
    'Transportation', -- Car payments, gas, public transit, ride-sharing
    'Entertainment', -- Movies, games, activities, streaming services
    'Insurance', -- Health, life, car, home insurance
    'Savings & Investments', -- Retirement funds, savings accounts, investments
    'Family & Personal Care', -- Haircuts, grooming, childcare, family events
    'Vacations & Travel', -- Flights, accommodations, family trips, tours
    'Miscellaneous', -- m
    '-- Split --'
  ) NOT NULL DEFAULT 'Miscellaneous';

CREATE TABLE citi_transaction (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- Unique ID for each record
    Status VARCHAR(50),                 -- Status of the transaction (e.g., 'Completed', 'Pending')
    Date DATE,                          -- Date of the transaction
    Description VARCHAR(255),           -- Description of the transaction
    Debit DECIMAL(10, 2),               -- Amount debited
    Credit DECIMAL(10, 2),              -- Amount credited
    CONSTRAINT check_debit_credit CHECK (Debit >= 0 AND Credit >= 0)  -- Ensure debit and credit are non-negative
);

create table vacation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name varchar(50),
    cost decimal(10,2),
    start_date DATE,
    end_date DATE,
    description text,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

create table vacation_detail (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vacation_id INT,
    payment_date DATE,
    item varchar(50), -- 'currency exchange'
    price decimal(10, 2),
    provider varchar(250),
    provider_url text, 
    currency_type varchar(10), -- USD $
    exchange_rate decimal(10,2), -- 1 USD to 1,432.50 KRW,
    exchange_amount decimal(10,2),
    description text,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

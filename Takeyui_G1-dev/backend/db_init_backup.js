const mysql = require('mysql');

// データベースに接続するための設定。
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: ''
  //database: 'mysql'
});

connection.connect(err => {
  if (err) throw err;
  console.log('MySQLに接続しました。');

  // 1. DROP DATABASE
  connection.query('DROP DATABASE IF EXISTS `Takeyui`', (err) => {
    if (err) throw err;
    console.log('データベースを削除しました。');

    // 2. CREATE DATABASE
    connection.query('CREATE DATABASE `Takeyui` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci', (err) => {
      if (err) throw err;
      console.log('データベースを作成しました。');

      // 3. USE Database
      connection.query('USE `Takeyui`', (err) => {
        if (err) throw err;
        console.log('作成したデータベースに切り替えました。');
        
        // 4. CREATE TABLE (users)
        const createUsersTableSql = `
          CREATE TABLE \`users\` (
              \`user_id\` INT AUTO_INCREMENT PRIMARY KEY,
              \`mail_address\` VARCHAR(255) NOT NULL UNIQUE,
              \`account_name\` VARCHAR(255) NOT NULL,
              \`password\` VARCHAR(255) NOT NULL,
              \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        connection.query(createUsersTableSql, (err) => {
          if (err) throw err;
          console.log('`users`テーブルを作成しました。');

          // 5. CREATE TABLE (items)
          const createItemsTableSql = `
            CREATE TABLE \`items\` (
                \`item_id\` INT AUTO_INCREMENT PRIMARY KEY,
                \`item_name\` VARCHAR(255) NOT NULL,
                \`item_description\` VARCHAR(255) NOT NULL,
                \`price\` DECIMAL(10, 2) NOT NULL,
                \`imagefilename\` VARCHAR(255) NOT NULL,
                \`user_id\` INT NOT NULL,
                \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
          `;
          connection.query(createItemsTableSql, (err) => {
            if (err) throw err;
            console.log('`items`テーブルを作成しました。');

            // 6. CREATE TABLE (events)
            const createEventsTableSql = `
              CREATE TABLE \`events\` (
                  \`event_id\` INT AUTO_INCREMENT PRIMARY KEY,
                  \`event_name\` VARCHAR(255) NOT NULL,
                  \`event_description\` VARCHAR(255) NOT NULL,
                  \`price\` DECIMAL(10, 2) NOT NULL,
                  \`imagefilename\` VARCHAR(255) NOT NULL,
                  \`location_id\` INT NOT NULL,
                  \`user_id\` INT NOT NULL,
                  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `;

            connection.query(createEventsTableSql, (err) => {
              if (err) throw err;
              console.log('`events`テーブルを作成しました。');

              // 7. CREATE TABLE (locations)
              const createLocationsTableSql = `
                CREATE TABLE \`locations\` (
                    \`location_id\` INT AUTO_INCREMENT PRIMARY KEY,
                    \`address\` VARCHAR(255) NOT NULL UNIQUE,
                    \`name\` VARCHAR(255) NOT NULL,
                    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
              `;

              connection.query(createLocationsTableSql, (err) => {
                if (err) throw err;
                console.log('`locations`テーブルを作成しました。');

                // 8. CREATE TABLE (schedules)
                const createSchedulesTableSql = `
                  CREATE TABLE \`schedules\` (
                      \`schedule_id\` INT AUTO_INCREMENT PRIMARY KEY,
                      \`event_id\` INT NOT NULL,
                      \`event_date\` DATE NOT NULL,
                      \`capacity\` INT NOT NULL,
                      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                `;

                connection.query(createSchedulesTableSql, (err) => {
                  if (err) throw err;
                  console.log('`schedules`テーブルを作成しました。');

                  // 9. CREATE TABLE (reservations)
                  const createReservationsTableSql = `
                    CREATE TABLE \`reservations\` (
                        \`reservation_id\` INT AUTO_INCREMENT PRIMARY KEY,
                        \`schedule_id\` INT NOT NULL,
                        \`user_id\` INT NOT NULL,
                        \`number_of_participants\` INT NOT NULL,
                        \`status\` VARCHAR(255) NOT NULL,
                        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                  `;

                  connection.query(createReservationsTableSql, (err) => {
                    if (err) throw err;
                    console.log('`reservations`テーブルを作成しました。');

                    // 10. CREATE TABLE (orders)
                    const createOrdersTableSql = `
                      CREATE TABLE \`orders\` (
                          \`order_id\` INT AUTO_INCREMENT PRIMARY KEY,
                          \`user_id\` INT NOT NULL,
                          \`total_amount\` DECIMAL(10, 2) NOT NULL,
                          \`status\` VARCHAR(255) NOT NULL,
                          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                    `;

                    connection.query(createOrdersTableSql, (err) => {
                      if (err) throw err;
                      console.log('`orders`テーブルを作成しました。');

                      // 11. CREATE TABLE (order_items)
                      const createOrderitemsTableSql = `
                        CREATE TABLE \`order_items\` (
                            \`order_items_id\` INT AUTO_INCREMENT PRIMARY KEY,
                            \`order_id\` INT NOT NULL,
                            \`item_id\` INT NOT NULL,
                            \`quantity\` INT NOT NULL,
                            \`price_at_purchase\` DECIMAL(10, 2) NOT NULL,
                            \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                      `;

                      connection.query(createOrderitemsTableSql, (err) => {
                        if (err) throw err;
                        console.log('`order_items`テーブルを作成しました。');
                        connection.end();
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});
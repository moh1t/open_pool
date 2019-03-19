drop database if exists OpenPool;
create database OpenPool;
use OpenPool;
create table users (
    user_id int primary key auto_increment,
    first_name varchar(255) not null,
    last_name varchar(255) not null,
    username varchar(255) not null,
    email varchar(255) not null,
    sex char(1) not null,
    contact_number numeric(10) not null,
    password varchar(255) not null,
    created_at timestamp not null default now()
 );
 create table vehicle (
     trip_id int primary key auto_increment,
     t_from varchar(255) not null,
     t_to varchar(255) not null,
     t_on timestamp not null,
     user_id int not null,
     foreign key (user_id) references users(user_id)
 );
 select t_on, contact_number from vehicle inner join users on users.user_id = vehicle.user_id where (t_from = "jaipur" and t_to = "suratgarh");

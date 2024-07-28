select register_user(_name => 'ice', _password => 'cream');
insert into superusers select id from users where name = 'ice';

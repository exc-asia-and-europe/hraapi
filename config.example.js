module.exports = {
	secret: '<<insertyoursecrethere>>',
/*	'database': 'mongodb://localhost/hra-annos',
*/	database:{
		uri: 'localhost',
		database: 'annotations',
		port: '27017',
		user: null,
		password: null
	},
	ldapIdSuffix: '@ad.mycompany.com',
	ldapStrategyOpts: {
		server: {
			url: 'ldap://mycompany.com:3268',
			bindDn: 'cn=someone,ou=users,dc=ad,dc=mycompany,dc=com',
			bindCredentials: '',
			searchBase: 'DC=ad,DC=mycompany,DC=de',
			searchFilter: '(sAMAccountName={{username}})'
		}
	}
};

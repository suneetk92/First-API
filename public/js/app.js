// Name our angular app
angular.module('routerApp', [])
// Creare the controllers
// This will be the controller for the Entire site
.controller('mainController', function() {
	// Bind this to vm (view-model)
	var vm = this;

	// Create a bigmessage variable to display in our view
	vm.bigMessage = 'A smooth sea never make a skilled sailor.';
})
// Home page specific controller
.controller('homeController', function() {
	var vm = this;
	vm.message = 'This is the home page!';	
})
// About page controller
.controller('aboutController', function() {
	var vm = this;
	vm.message = 'Look! I am an about page';
})
// Contact page controller
.controller('contactController', function() {
	var vm = this;
	vm.message = 'Contact us! JK. This is just a demo';
});
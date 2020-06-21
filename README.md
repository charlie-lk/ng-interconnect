# NgInterconnect

Makes it possible to override Angular event emitting structure between components. Works across routes. The library contains the code and a sample demo app.

# Usage
Import `{Interconnect}` from the library


# API

## Create a connection (a connection host) from any component

`createConnection(name: string): EventEmitter`

The returned event emitter can be used to `emmit`, `error` or `complete`. All the client connections will be notified of these events when invoked. Any subsequent creation of the same connection (same name) will return the same event emitter.

If the `complete` methof od the event is invoked, the clients will be notified and the connection will be destroyed. All the client connections are destroyed too.

The connection name should be a strig compatible with JS object key strings.


## Making a client connection (to the host) from any component

`connectTo(connectionName: string, clientName: string, callback (function)): disconenct function`

The `clientName` is a unique name and should be a strig compatible with JS object key strings. Any subsequent connections with the same client name will delete the former callback and installs the new one. The dicsonnect function can be called when diconnec from the connection is required.

The callback function should be given 3 arguments.

`(value, error, complete) => {}`

Any amitted vlaue or error will be reflected in the respective arguments. The `complete` argument will be `true` at the completion.


## Getting debug info
The information about all the connections and the clients can be obtained by calling the `connectionInfo` method.



## Crteate Notifiers

A notifier is one time alert of an event. 

`createNotifier(name: string): Promise<any>`

The returned promise would be fullfilled or rejected by the party who makes a notification on this notifier.


## Issuing a notification

'notifiers(name: string)'

The `notifiers` method returns a notifier object matching the name. The notifier object contains the `notify(value: string)` and `error(string)` methods. Calling of either method would fullfill ort reject the promised returned when creating the notifier and delete it immeditately.


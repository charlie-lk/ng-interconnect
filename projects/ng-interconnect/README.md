# NgInterconnect

Makes it possible to override Angular event emitting structure between components. Works across routes. The library contains the code and a sample demo app.

# Usage

[![NPM](https://nodei.co/npm/ng-interconnect.png?mini=true)](https://nodei.co/npm/ng-interconnect/)

Import `{Interconnect}` from the library


# API

## Creating a connector (a connection host) from any component

`createConnector(name: string): EventEmitter`

The returned event emitter can be used for invoking `emmit`, `error` or `complete` methods. All the client connections will be notified of these events when invoked. Any subsequent creation of the same connector (same name) will return the same event emitter.

If the `complete` methof od the event is invoked, all the clients will be notified and the connector will be destroyed. All the client connections are destroyed too.

The connector name should be a strig compatible with JS object key strings.


## Making a client connection from any component

`connectTo(connectorName: string, connectionName: string, callback (function)): disconenct function`

The `connectorName` is the connector you which to connecto to and the `connectionName` is a the name of the connection being made. The `connectionNane` too should be a strig compatible with JS object key strings. Any subsequent connections with the same connection name will delete the former callback and will install a new one. The dicsonnect function can be called when diconnec from the connection is required.

The callback function should be given 3 arguments.

`(value, error, complete) => {}`

Any emitted vlaue or error will be reflected in the respective arguments. The `complete` argument will be `true` at the completion.


## Getting debug info
The information about all the connectors and the connections can be obtained by calling the `info` method.



## Creating Notifiers

A notifier is one time alert of an event. 

`createNotifier(name: string): Promise<any>`

The returned promise would be fullfilled or rejected by the party who makes a notification on this notifier.


## Issuing a notification

'notifiers(name: string)'

The `notifiers` method returns a notifier object matching the name. The notifier object contains the `notify(value: string)` and `error(string)` methods. Calling of either method would fullfill ort reject the promised returned when creating the notifier and delete it immeditately.


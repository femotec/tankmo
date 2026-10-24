import Capacitor

final class TankmoViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(TankmoLocalDataPlugin())
    }
}

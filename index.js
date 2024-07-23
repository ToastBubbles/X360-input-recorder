const HID = require('node-hid');

// Find Xbox 360 controller
const devices = HID.devices();
const xbox360Devices = devices.filter(device =>
    device.vendorId === 1118 && device.productId === 654);

if (xbox360Devices.length === 0) {
    console.error('Xbox 360 controller not found.');
    process.exit(1);
}

const xbox360Device = new HID.HID(xbox360Devices[0].path);

console.log('Xbox 360 controller found. Waiting for input...');

const stickDeadzone = 0.1;
const triggerDeadzone = 0.1;

let controllerState = {
    A: false,
    B: false,
    X: false,
    Y: false,
    LB: false,
    RB: false,
    LT: 0,
    RT: 0,
    BB: false,
    Start: false,
    LS: false,
    RS: false,
    LSX: 0,
    LSY: 0,
    RSX: 0,
    RSY: 0,
    L: false,
    R: false,
    U: false,
    D: false
};
///Change these to your liking
const settings = {
    initiateRecording: 'LB', // Customize this to the desired button for initiating recording
    stopRecording: 'RB', // Customize this to the desired button for stopping recording
    leftStickDeadzone: stickDeadzone,
    rightStickDeadzone: stickDeadzone,
    leftTriggerDeadzone: triggerDeadzone,
    rightTriggerDeadzone: triggerDeadzone
};

let recording = false;
const commands = [];
let lastTimestamp = Date.now();
let recordingStarted = false;

// Event listener for data
xbox360Device.on('data', (data) => {
    try {
        // Interpret data
        const [reportId, buttons1, buttons2, leftX, leftY, rightX, rightY, leftTrigger, rightTrigger] = data;
        const normalizeStick = value => (value - 128) / 128.0;
        const normalizeTrigger = value => value / 255.0;

        const currentValues = {
            A: !!(buttons1 & 0x10),
            B: !!(buttons1 & 0x20),
            X: !!(buttons1 & 0x40),
            Y: !!(buttons1 & 0x80),
            LB: !!(buttons1 & 0x01),
            RB: !!(buttons1 & 0x02),
            LT: normalizeTrigger(leftTrigger).toFixed(2),
            RT: normalizeTrigger(rightTrigger).toFixed(2),
            BB: !!(buttons1 & 0x04),
            Start: !!(buttons1 & 0x08),
            LS: !!(buttons2 & 0x01),
            RS: !!(buttons2 & 0x02),
            LSX: normalizeStick(leftX).toFixed(2),
            LSY: normalizeStick(leftY).toFixed(2),
            RSX: normalizeStick(rightX).toFixed(2),
            RSY: normalizeStick(rightY).toFixed(2),
            L: !!(buttons2 & 0x40),
            R: !!(buttons2 & 0x80),
            U: !!(buttons2 & 0x10),
            D: !!(buttons2 & 0x20),
        };

        const buttonNames = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'BB', 'Start', 'LS', 'RS', 'LSX', 'LSY', 'RSX', 'RSY', 'L', 'R', 'U', 'D'];

        if (currentValues[settings.initiateRecording] && !controllerState[settings.initiateRecording]) {
            // Only start recording if it was not already started
            if (!recording) {
                recording = true;
                recordingStarted = true;
                commands.length = 0; // Clear any previous commands
                lastTimestamp = Date.now();
                console.log('Recording started.');
            }
        }

        // Stop recording logic
        if (currentValues[settings.stopRecording] && !controllerState[settings.stopRecording]) {
            // Only stop recording if it was currently recording
            if (recording) {
                recording = false;
                console.log('Recording stopped. Commands:');
                console.log(commands.join('\n'));
            }
        }

        // If recording is active, process data
        if (recording) {
            const currentTime = Date.now();
            const timeDelta = currentTime - lastTimestamp;

            buttonNames.forEach(button => {
                if (currentValues[button] !== controllerState[button]) {
                    commands.push(`wait(${timeDelta});`);
                    const value = currentValues[button];
                    const buttonValue = value === true ? 100 : (value === false ? 0 : value);
                    commands.push(`setVal(BUTTON_${button}, ${buttonValue});`);
                    lastTimestamp = currentTime;
                }
            });
        }

        // Update controller state
        controllerState = { ...currentValues };

    } catch (error) {
        console.error('Error processing data:', error);
    }
});


// Event listener for error
xbox360Device.on('error', error => {
    console.error('Error:', error);
});

// Keep the program running
process.stdin.resume();
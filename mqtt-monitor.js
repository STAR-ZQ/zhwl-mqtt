/**
 * 自定义函数
 */
// 对Date的扩展，将 Date 转化为指定格式的String   
// 月(M)、日(d)、小时(H)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，   
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)   
// 例子：   
// (new Date()).Format("yyyy-MM-dd HH:mm:ss.S") ==> 2006-07-02 08:09:04.423   
// (new Date()).Format("yyyy-M-d H:m:s.S")      ==> 2006-7-2 8:9:4.18   
Date.prototype.Format = function (fmt) { //author: meizz   
    let o = {
        "M+": this.getMonth() + 1,                 //月份   
        "d+": this.getDate(),                    //日   
        "h+": this.getHours(),                   //小时   
        "m+": this.getMinutes(),                 //分   
        "s+": this.getSeconds(),                 //秒   
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度   
        "S": this.getMilliseconds()             //毫秒   
    };
    if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (let k in o)
        if (new RegExp("(" + k + ")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

const events = require('events');
const eventMqttResp = new events.EventEmitter();

/**
 * MQTT Config
 */
const mqtt = require('mqtt');
const fs = require('fs');
let clientIdRandom = Math.random().toString(36).substr(2);
const mqttOptions = {
    clientId: "test_" + clientIdRandom,
    protocolVersion: 5,
    connectTimeout: 30 * 1000,
    username: 'emq',
    password: 'test',
    keepalive: 60,
    clean: true
}

const mqttHost = 'mqtt://192.168.101.200:1883';

const client = mqtt.connect(mqttHost, mqttOptions);

client.on('connect', () => {
    initDeviceInfo();
    console.log("初始化数组信息：masterAttr:", masterAttr, "gatewayAttr:", gatewayAttr, "slaveAttr:", slaveAttr)
    console.log('MQTT Broker Connected!');

    // client.subscribe('hello', (error) => {
    //     console.log(error || 'Subscribe success.');
    // });

    // client.publish('hello', 'hello mqtt.', (error) => {
    //     console.log(error || 'Publish success.');
    // })

});

client.on('reconnect', () => {
    console.log('Reconnecting...');
});

client.on('error', (error) => {
    console.log('Connect failed:', error);
});

client.on('message', (topic, payload) => {
    // if (sseRes != undefined) {
    //     sseRes.write('data: ' + JSON.stringify({ topic: topic, payload: payload.toString(), timestamp: new Date().Format('yyyy-MM-dd hh:mm:ss') }) + '\n\n');
    // }
    let logs = new Date().Format('yyyy/MM/dd hh:mm:ss') + " - " + "[Recved]\n" + "Topic: " + topic + "\n" + "Payload: " + payload.toString() + "\n\n";
    console.log(logs);

    fs.writeFile("mqttlogs.log", logs, { "flag": "a" }, (err) => {
        if (err) {
            console.log(err);
        }
    });

    // console.log("topic", topic, "payload", JSON.stringify(payload))
    handleReceivedMqttMsg(topic, payload);
});


let devices = new Array();
const MQTT_JSON_API_VERSION = '2.0.0';
let mqttMsgID = 1;
// var masterAttr = new Array("010201"); //010501/0100601
// var gatewayAttr = new Array("010401");
// var slaveAttr = new Array("010301", "FFFFFF");
var masterDeviceInfo = new Array({ "010201": 1 },{ "FFFFFF": 1 }); //010501/0100601
var gatewayInfo = new Array({ "010401": 0 },{ "010402": 6 });
var slaveDeviceInfo = new Array({ "010301": 4 }, { "FFFFFF": 4 });

var masterAttr = new Array();
var slaveAttr = new Array();
var gatewayAttr = new Array();
/**
 * 初始化设备id数组信息（为了不重新改之前的代码）
 */
function initDeviceInfo() {
    for (let i = 0; i < masterDeviceInfo.length; i++) {
        for (const key in masterDeviceInfo[i]) {
            masterAttr.push(key)
        }
    }
    // console.log("initDeviceInfo.masterDeviceInfo:",masterDeviceInfo,"取值：",masterDeviceInfo[0]['010201'])
    for (let i = 0; i < gatewayInfo.length; i++) {
        for (const key in gatewayInfo[i]) {
            gatewayAttr.push(key)
        }
    }
    for (let i = 0; i < slaveDeviceInfo.length; i++) {
        for (const key in slaveDeviceInfo[i]) {
            slaveAttr.push(key)
        }
    }
}
let randomId;//随机数
function handleReceivedMqttMsg(topic, payload) {
    let topicArr = topic.split('/');
    let id = topicArr[topicArr.length - 2];
    // var subStrPayload = payload.substr(0,2);
    // console.log(payload + "payload==》", topicArr, "topic", id, "id");
    var lastWord = topicArr[topicArr.length - 1];
    console.log("lastWord:", lastWord)
    if (lastWord != 'sys_resp') {
        let jsonPayload = JSON.parse(payload);

        let srcmsgid = jsonPayload.srcmsgid
        let data = jsonPayload.data;
        console.log(JSON.stringify(jsonPayload))
        console.log("测试是否进入响应方法");
        if (lastWord == 'cmd' || lastWord == 'cmd_resp') {
            console.log(`${id}.${srcmsgid}`,"cmd_resp===")
            eventMqttResp.emit(`${id}.${srcmsgid}`, jsonPayload);
            eventMqttResp.emit(`cmd_report`, id, data);
        }
        if (lastWord == 'report') {
            eventMqttResp.emit(`device_report`, id, data);
        }
        // eventMqttResp.emit(`${id}.${srcmsgid}`, jsonPayload);
        // eventMqttResp.emit(`device_report`, id, data);
    } else {
        console.log("handleReceivedMqttMsg随机数：", randomId, "payload:", payload.toString())
        eventMqttResp.emit(`${id}.${randomId}`, payload.toString());
    }
}

eventMqttResp.on('cmd_report', (id, data) => {
    if (data != undefined) {
        let device;
        let idx = devices.findIndex((ele) => {
            return ele.device_id == id;
        });
        if (idx != -1) {
            device = devices[idx];
            // console.log("id", id, "==>", data, "report内部:==>", device, "device")

            // var keys = new Map();
            // // console.log(Object.keys(data[0]), "测试")
            // for (let i = 0; i < data.length; i++) {
            //     const arr = data[i];
            //     for (var key in data[i]) {
            //         if (data.hasOwnProperty(key))
            //             keys.set(key, value)
            //     }
            //     console.log(JSON.stringify(keys), "keys")
            // }
            data = JSON.stringify(data).replace(" ", "");
            // console.log(data, "data")
            var objs = JSON.parse(data);
            // var keys = Object.keys(objs);

            let objsAttr = [];
            objsAttr.push(objs);
            // console.log(objs, "objs",objsAttr,"objAttr")


            // console.log("测试拿data信息:", objs[0].line_id)

            for (let index = 0; index < objsAttr.length; index++) {
                const payloadInfo = objsAttr[index];//拿到响应数据的对象

                for (const key in payloadInfo) {
                    // console.log("key:", key, "value:", payloadInfo[key], "payloadInfo:", payloadInfo.line_id)
                    switch (key) {
                        case "voltage":
                            device.voltage[payloadInfo.line_id] = payloadInfo[key];
                            break;
                        case "current":
                            device.current[payloadInfo.line_id] = payloadInfo[key];
                            break;
                        case "frequency":
                            device.frequency[payloadInfo.line_id] = payloadInfo[key];
                            break;
                        case "leak_current":
                            device.leak_current[payloadInfo.line_id] = payloadInfo[key];
                            break;
                        case "power_p":
                            device.power_p[payloadInfo.line_id] = payloadInfo[key];
                            break;
                        case "power_q":
                            device.power_q[payloadInfo.line_id] = payloadInfo[key];
                            break;
                        case "power_s":
                            device.power_s[payloadInfo.line_id] = payloadInfo[key];
                            break;
                        case "energy_p":
                            device.energy_p[payloadInfo.line_id] = payloadInfo[key];
                            break;
                        case "energy_q":
                            device.energy_q[payloadInfo.line_id] = payloadInfo[key];
                            break;
                        case "switch":
                            // let switchInfo;
                            // if (payloadInfo[key] == 1) {
                            //     switchInfo = "on"
                            // } else {
                            //     switchInfo = "off"
                            // }
                            device.switch_state[payloadInfo.line_id] = payloadInfo[key];
                            break;
                        case "pwm_state":
                            device.pwm_state = payloadInfo[key];
                            break;
                        case "v0_10_state":
                            device.v0_10_state = payloadInfo[key];
                            break;
                        case "tilt":
                            device.tilt = payloadInfo[key];
                            break;
                        case "signal":
                            device.signal = payloadInfo[key];
                            break;
                    }

                }
                // console.log(device, "device")

            }
            //console.log(device);
        }
    }
})


eventMqttResp.on('device_report', (id, data) => {
    if (data != undefined) {
        let device;
        let idx = devices.findIndex((ele) => {
            return ele.device_id == id;
        });
        if (idx != -1) {
            device = devices[idx];
            // console.log("id", id, "==>", data, "report内部:==>", device, "device")

            // var keys = new Map();
            // // console.log(Object.keys(data[0]), "测试")
            // for (let i = 0; i < data.length; i++) {
            //     const arr = data[i];
            //     for (var key in data[i]) {
            //         if (data.hasOwnProperty(key))
            //             keys.set(key, value)
            //     }
            //     console.log(JSON.stringify(keys), "keys")
            // }
            data = JSON.stringify(data).replace(" ", "");
            // console.log(data, "data")
            var objs = JSON.parse(data);
            // var keys = Object.keys(objs);

            // console.log(objs, "objs")


            // console.log("测试拿data信息:", objs[0].line_id)

            for (let index = 0; index < objs.length; index++) {
                const payloadInfo = objs[index];//拿到响应数据的对象

                for (const key in payloadInfo) {
                    // console.log("key:", key, "value:", payloadInfo[key], "payloadInfo:", payloadInfo.line_id)
                    switch (key) {
                        case "voltage":
                            device.voltage[payloadInfo.line_id] = payloadInfo[key];
                            break;
                        case "current":
                            device.current[payloadInfo.line_id] = payloadInfo[key];
                            break;
                        case "frequency":
                            device.frequency[payloadInfo.line_id] = payloadInfo[key];
                            break;
                        case "leak_current":
                            device.leak_current[payloadInfo.line_id] = payloadInfo[key];
                            break;
                        case "power_p":
                            device.power_p[payloadInfo.line_id] = payloadInfo[key];
                            break;
                        case "power_q":
                            device.power_q[payloadInfo.line_id] = payloadInfo[key];
                            break;
                        case "power_s":
                            device.power_s[payloadInfo.line_id] = payloadInfo[key];
                            break;
                        case "energy_p":
                            device.energy_p[payloadInfo.line_id] = payloadInfo[key];
                            break;
                        case "energy_q":
                            device.energy_q[payloadInfo.line_id] = payloadInfo[key];
                            break;
                        case "switch":
                            device.switch_state[payloadInfo.line_id] = payloadInfo[key];
                            break;
                        case "pwm_state":
                            device.pwm_state = payloadInfo[key];
                            break;
                        case "v0_10_state":
                            device.v0_10_state = payloadInfo[key];
                            break;
                        case "tilt":
                            device.tilt = payloadInfo[key];
                            break;
                        case "signal":
                            device.signal = payloadInfo[key];
                            break;
                    }

                }
                // console.log(device, "device")

            }
            //console.log(device);
        }
    }
})

/**
 * Express config
 */
const path = require('path');
const express = require('express');
const { json } = require('express');
const webServer = express();
const webHost = {
    name: '0.0.0.0',
    port: 18082
}

webServer.use(express.static(path.join(__dirname, 'public')));
webServer.use(express.json());
webServer.use(express.urlencoded({ extended: true }));

webServer.listen(webHost.port, webHost.name,
    () => console.log(`Web server listening on ${webHost.name}:${webHost.port}`));

// // 订阅请求
// webServer.post('/subscribe', (req, res, next) => {
//     console.log(req.body);
//     if (req.body.deviceSN != undefined) {
//         mqttSub(req.body.deviceSN, res);
//     } else {
//         res.status(404).end();
//     }
// });

// // 取消订阅请求
// webServer.post('/unsubscribe', (req, res, next) => {
//     console.log(req.body);
//     if (req.body.deviceSN != undefined) {
//         mqttUnsub(req.body.deviceSN, res);
//     } else {
//         res.status(404).end();
//     }
// });

// // 发布消息请求
// webServer.post('/publish', (req, res, next) => {
//     console.log(req.body);
//     if (req.body.topic != undefined && req.body.payload != undefined && req.body.qos != undefined) {
//         mqttPub(req.body.topic, req.body.payload, req.body.qos, res);
//     } else {
//         res.status(404).end();
//     }
// });


/**
 * @brief 获取设备基础信息
 */
webServer.get('/device/base', (req, res, next) => {
    //console.log(req.query);
    let id = req.query.id;
    if (id != undefined) {
        if (id == 'all') {
            let response = {
                device: devices
            }
            res.send(response);
        }
        else if (id.length == 12) {
            console.log("devices", JSON.stringify(devices))
            let index = devices.findIndex((ele) => {
                return ele.device_id == id;
            });
            if (index != -1) {
                let response = {
                    device: [devices[index]]
                }
                res.send(response);
            }
            else {
                res.status(404).send('device not found');
            }
        }
        else {
            res.status(406).send('wrong id');
        }
    }
    else {
        res.status(500).send('wrong param');
    }
});



function initDevice(id, isFlag, num) {
    device = {
        device_id: id,
        switchNum: [num],
        isSlaveDevice: isFlag,//是否从设备装置
        voltage: [], // 电压   //voltage[0]=220
        current: [], // 电流
        frequency: [], // 频率
        leak_current: [], // 漏电电流
        power_p: [], // 有功功率
        power_q: [], // 无功功率
        power_s: [], // 视在功率
        energy_p: [], // 有功电能
        energy_q: [], // 武功电能
        switch_state: [], // 开关状态
        pwm_state: 0, // PWM 值
        v0_10_state: 0, // 0-10V 值
        tilt: 0, // 倾斜度
        signal: 0 // 信号强度
    }

    return device;
}
let swtichNum;//开关数量

/**
 * @brief 新增设备
 */
webServer.post('/device/base', (req, res, next) => {
    //console.log(req.body);


    let id = req.body.id;
    if (id != undefined) {
        let index = devices.findIndex((ele) => {
            return ele.device_id == id;
        });
        console.log("index:" + index);
        if (index == -1) {

            var ids = id.substr(0, 6);

            var masterId = masterAttr.findIndex((ele) => {
                return ele == ids;
            })
            var gatewayId = gatewayAttr.findIndex((ele) => {
                return ele == ids;
            })

            console.log("id前六位：" + ids + "masterId:" + masterId + "slaveId:" + gatewayId);
            if (masterId != -1) {
                console.log("主设备===================");
                // for (const key in masterDeviceInfo) {
                let indexs = masterAttr.findIndex((ele) => {
                    return ele == ids;
                })
                switchNum = masterDeviceInfo[indexs][ids];
                // }
                devices.push(initDevice(id, "否", switchNum));
                mqttSub(id, (ret, err) => {
                    if (ret == 0) {
                        res.status(201).send('success');
                    }
                    else {
                        res.status(500).send(err);
                    }
                });
            } else if (gatewayId != -1) {
                console.log(JSON.stringify(gatewayAttr,"======"))
                let indexs = gatewayAttr.findIndex((ele) => {
                    console.log(ele,"==========")
                    return ele == ids;
                })
                switchNum = gatewayInfo[indexs][ids];
                console.log("从设备===================",indexs,ids,JSON.stringify(gatewayInfo), switchNum);
                devices.push(initDevice(id, "否", switchNum));
                mqttSlaveSub(id, (ret, err) => {
                    if (ret == 0) {
                        res.status(200).send('success');
                    }
                    else {
                        res.status(500).send(err);
                    }
                });
                slaveList(id, (ret, err) => {
                    console.log("slaveList end info ============" + ret);
                    // if (ret == 0) {
                    //     res.status(200).send('success');
                    // }
                    // else {
                    //     res.status(500).send(err);
                    // }
                });
            }
        }
        else {
            res.send('device already exist');
        }
    }
    else {
        res.send('wrong param');
    }
});


/**
 * @brief 删除设备
 */
webServer.delete('/device/base', (req, res, next) => {
    //console.log(req.body);
    let id = req.body.id;
    if (id != undefined) {
        let index = devices.findIndex((ele) => {
            return ele.device_id == id;
        });
        if (index != -1) {
            devices.splice(index, 1);
            mqttUnsub(id, (ret, err) => {
                if (ret == 0) {
                    res.status(201).send('success');
                }
                else {
                    res.status(500).send(err);
                }
            });
        }
        else {
            res.status(404).send('device not exist');
        }
    }
    else {
        res.status(500).send('wrong param');
    }
});

webServer.post('/device/action', (req, res, next) => {
    //console.log(req.body);
    let id = req.body.id;
    let action_type = req.body.action_type;
    // let action_id = req.body.action_id;//key
    // let action = req.body.action;//value
    let num = req.body.num;

    let obj = {};
    for (let i in num) {

        if (num[i].status == 0) {
            num[i].status = 'off'
        } else if (num[i].status == 1) {
            num[i].status = 'on'
        }
        // num[i].status == 0 ? 'off' : 'on';
        obj[num[i].indexs] = num[i].status

    }
    console.log(obj, "obj2", id, "id", num, "num")


    if (id != undefined) {
        let index = devices.findIndex((ele) => {
            return ele.device_id == id;
        });
        if (index != -1) {
            let mqttReq = {
                version: MQTT_JSON_API_VERSION,
                msgid: `${mqttMsgID++}`,
                method: 'act.do',
                data: { [action_type]: obj },
                // { [`${action_id}`]: `${action}` }
                time: `${(new Date()).Format("yyyyMMddhhmmss")}`
            }
            console.log("action:" + JSON.stringify(mqttReq));
            var ids = id.substr(0, 6);

            var masterId = masterAttr.findIndex((ele) => {
                return ele == ids;
            })
            var gatewayId = gatewayAttr.findIndex((ele) => {
                return ele == ids;
            })
            var slaveId = slaveAttr.findIndex((ele) => {
                return ele == ids;
            })
            if (masterId != -1) {
                console.log("主设备===================");
                mqttPub(`/device/${id}/cmd`, JSON.stringify(mqttReq), 1, (ret, err) => {
                    if (ret == 0) {
                        res.status(200).send('success');
                    }
                    else {
                        res.status(500).send(err);
                    }
                });
            } else if (gatewayId != -1 || slaveId != -1) {
                console.log("从设备===================idMap.get(id):", idMap.get(id));
                if (idMap.get(id) != undefined) {
                    mqttPub(`/gateway/${idMap.get(id)}/${id}/cmd`, JSON.stringify(mqttReq), 1, (ret, err) => {
                        if (ret == 0) {
                            // console.log("chenggong=============")
                            res.status(200).send('success');
                        }
                        else {
                            res.status(500).send(err);
                        }
                    });
                } else {
                    mqttPub(`/gateway/${id}/cmd`, JSON.stringify(mqttReq), 1, (ret, err) => {
                        if (ret == 0) {
                            // console.log("chenggong=============")
                            res.status(200).send('success');
                        }
                        else {
                            res.status(500).send(err);
                        }
                    });
                }
            }
        }
        else {
            res.status(404).send('device not exist');
        }
    }
    else {
        res.status(500).send('wrong param');
    }
});

webServer.put('/device/tag', (req, res, next) => {
    //console.log(req.body);
    let id = req.body.id;
    let tag = req.body.tag;
    let lineId = req.body.lineId;
    if (id != undefined && tag != undefined) {
        let index = devices.findIndex((ele) => {
            return ele.device_id == id;
        });

        if (index != -1) {
            let mqttReq = {
                version: MQTT_JSON_API_VERSION,
                msgid: `${mqttMsgID++}`,
                method: "tag.get",
                data: { 'line_id': `${lineId}`, 'tags': tag },
                time: `${(new Date()).Format("yyyyMMddhhmmss")}`
            }
            console.log(JSON.stringify(mqttReq), "device.tag===>id:", id)
            var ids = id.substr(0, 6);
            var masterId = masterAttr.findIndex((ele) => {
                return ele == ids;
            })
            var gatewayId = gatewayAttr.findIndex((ele) => {
                return ele == ids;
            })

            var slaveId = slaveAttr.findIndex((ele) => {
                return ele == ids;
            })
            console.log("masterId:", masterId, "slaveId:", slaveId, "gatewayId:", gatewayId)
            if (masterId != -1) {
                mqttPub(`/device/${id}/cmd`, JSON.stringify(mqttReq), 1, (ret, err) => {
                    if (ret == 0) {
                        res.status(201).send('success');
                    }
                    else {
                        res.status(500).send(err);
                    }
                });
            }
            if (gatewayId != -1 || slaveId != -1) {

                if (idMap.get(id) != undefined) {
                    mqttPub(`/gateway/${idMap.get(id)}/${id}/cmd`, JSON.stringify(mqttReq), 1, (ret, err) => {
                        if (ret == 0) {
                            console.log("成功tag")
                            res.status(201).send('success');
                        }
                        else {
                            res.status(500).send(err);
                        }
                    });
                } else {
                    mqttPub(`/gateway/${id}/cmd`, JSON.stringify(mqttReq), 1, (ret, err) => {
                        if (ret == 0) {
                            console.log("成功tag")
                            res.status(201).send('success');
                        }
                        else {
                            res.status(500).send(err);
                        }
                    });
                }


            }
        }
        else {
            res.status(404).send('device not exist');
        }
    }
    else {
        res.status(500).send('wrong param');
    }
});

webServer.get('/device/cfg', (req, res, next) => {
    //console.log(req.query);
    let id = req.query.id;
    let cfg = req.query.cfg;
    if (id != undefined && cfg != undefined) {
        let index = devices.findIndex((ele) => {
            return ele.device_id == id;
        });
        if (index != -1) {
            let mqttReq = {
                version: MQTT_JSON_API_VERSION,
                msgid: `${mqttMsgID++}`,
                method: 'cfg.get',
                data: { config: `${cfg}` },
                time: `${(new Date()).Format("yyyyMMddhhmmss")}`
            }
            var ids = id.substr(0, 6);
            var masterId = masterAttr.findIndex((ele) => {
                return ele == ids;
            })
            var gatewayId = gatewayAttr.findIndex((ele) => {
                return ele == ids;
            })
            var slaveId = slaveAttr.findIndex((ele) => {
                return ele == ids;
            })
            if (masterId != -1) {
                mqttPubWaitResp(`/device/${id}/cmd`, JSON.stringify(mqttReq), 1, (ret, msg) => {
                    if (ret == 0) {
                        console.log(msg);
                        res.status(200).send(msg);
                    }
                    else {
                        res.status(500).send(msg);
                    }
                });
            }
            if (gatewayId != -1 || slaveId != -1) {
                if (idMap.get(id) != undefined) {
                    mqttPubWaitResp(`/gateway/${idMap.get(id)}/${id}/cmd`, JSON.stringify(mqttReq), 1, (ret, msg) => {
                        if (ret == 0) {
                            console.log("/device/cfg==>cfg.get==>slave:", msg);
                            res.status(200).send(msg);
                        }
                        else {
                            res.status(500).send(msg);
                        }
                    });
                } else {
                    mqttPubWaitResp(`/gateway/${id}/cmd`, JSON.stringify(mqttReq), 1, (ret, msg) => {
                        if (ret == 0) {
                            console.log("/device/cfg==>cfg.get==>gateway:", msg);
                            res.status(200).send(msg);
                        }
                        else {
                            res.status(500).send(msg);
                        }
                    });
                }
            }
        }
        else {
            res.status(404).send('device not exist');
        }
    }
    else {
        res.status(500).send('wrong param');
    }
});

webServer.put('/device/cfg', (req, res, next) => {
    //console.log(req.body);
    let id = req.body.id;
    let cfg = req.body.cfg;
    if (id != undefined && cfg != undefined) {
        let index = devices.findIndex((ele) => {
            return ele.device_id == id;
        });
        if (index != -1) {
            let mqttReq = {
                version: MQTT_JSON_API_VERSION,
                msgid: `${mqttMsgID++}`,
                method: 'cfg.set',
                data: JSON.parse(cfg),
                time: `${(new Date()).Format("yyyyMMddhhmmss")}`
            }
            var ids = id.substr(0, 6);
            var masterId = masterAttr.findIndex((ele) => {
                return ele == ids;
            })
            var gatewayId = gatewayAttr.findIndex((ele) => {
                return ele == ids;
            })
            var slaveId = slaveAttr.findIndex((ele) => {
                return ele == ids;
            })
            if (masterId != -1) {
                mqttPubWaitResp(`/device/${id}/cmd`, JSON.stringify(mqttReq), 1, (ret, msg) => {
                    if (ret == 0) {
                        console.log(msg);
                        res.status(200).send(msg);
                    }
                    else {
                        res.status(500).send(msg);
                    }
                });
            }
            if (gatewayId != -1 || slaveId != -1) {
                if (idMap.get(id) != undefined) {
                    mqttPubWaitResp(`/gateway/${idMap.get(id)}/${id}/cmd`, JSON.stringify(mqttReq), 1, (ret, msg) => {
                        if (ret == 0) {
                            console.log(msg);
                            res.status(200).send(msg);
                        }
                        else {
                            res.status(500).send(msg);
                        }
                    });
                } else {
                    mqttPubWaitResp(`/gateway/${id}/cmd`, JSON.stringify(mqttReq), 1, (ret, msg) => {
                        if (ret == 0) {
                            console.log(msg);
                            res.status(200).send(msg);
                        }
                        else {
                            res.status(500).send(msg);
                        }
                    });
                }
            }
        }
        else {
            res.status(404).send('device not exist');
        }
    }
    else {
        res.status(500).send('wrong param');
    }
});

/**
 * ota
 */
webServer.post('/device/ota', (req, res, next) => {
    //console.log(req.body);
    let id = req.body.id;
    let cfg = req.body.otaOperation;//命令后缀
    if (id != undefined && cfg != undefined) {
        let index = devices.findIndex((ele) => {
            return ele.device_id == id;
        });
        if (index != -1) {

            var ids = id.substr(0, 6);
            var masterId = masterAttr.findIndex((ele) => {
                return ele == ids;
            })
            var gatewayId = gatewayAttr.findIndex((ele) => {
                return ele == ids;
            })
            let order = ">>ota," + cfg;
            if (masterId != -1) {
                mqttPubOrderResp(`/device/${id}/sys`, order, 1, (ret, msg) => {
                    if (ret == 0) {
                        console.log(msg);
                        res.status(200).send(msg);
                    }
                    else {
                        res.status(500).send(msg);
                    }
                });
            }
            if (gatewayId != -1) {
                mqttPubOrderResp(`/gateway/${id}/sys`, order, 1, (ret, msg) => {
                    if (ret == 0) {
                        console.log(msg);
                        res.status(200).send(msg);
                    }
                    else {
                        res.status(500).send(msg);
                    }
                });
            }
        }
        else {
            res.status(404).send('device not exist');
        }
    }
    else {
        res.status(500).send('wrong param');
    }
})
var multiparty = require('multiparty');
/**
 * 图片上传跳转接口
 */
webServer.post('/device/upload', (req, res, next) => {
    //利用multiparty中间件获取文件数据
    let uploadDir = './' //这个不用改，因为并不是保存在这个目录下，这只是作为中间目录，待会要重命名文件到指定目录的
    let form = new multiparty.Form()
    form.uploadDir = uploadDir
    form.keepExtensions = true; //是否保留后缀
    form.parse(req, function (err, fields, files) { //其中fields表示你提交的表单数据对象，files表示你提交的文件对象
        console.log("上传文件", fields)
        console.log("files", files)
        //这里是save_path 就是前端传回来的 path 字段，这个字段会被 multiparty 中间件解析到 fields 里面 ，这里的 fields 相当于 req.body 的意思
        let save_path = fields.path
        if (err) {
            console.log(err)
            res.send(formatReq(0, "上传失败"))
        } else {
            let file_list = []
            if (!files.file) res.send(formatReq(0, "上传失败"))
            else {
                //所有文件重命名，（因为不重名的话是随机文件名）
                files.file.forEach(file => {
                    /*
                     * file.path 文件路径
                     * save_path+originalFilename   指定上传的路径 + 原来的名字
                     */
                    fs.rename(file.path, save_path + file.originalFilename, function (err) {
                        if (err) {
                            // console.log("重命名失败")
                        } else {
                            console.log("重命名成功")
                        }
                    });

                })
                if (err) {
                    console.log(err)
                    res.send(formatReq(0, "上传失败"))
                } else {
                    //返回所有上传的文件信息

                    res.send(formatReq(1, "上传成功"))
                }
            }
        }
    })
})
//统一格式化返回值
function formatReq(code, msg, data) {
    return {
        code: code,
        data: data,
        message: msg
    }
}

var multer = require('multer');
const { once } = require('events');

const upload = multer({ dest: 'public/uploads/' });

webServer.use(upload.single('file'))
/**
 * file
 */
webServer.post('/device/file', (req, res) => {
    let id = req.body.id;
    let cfg = req.body.fileOperation;//命令后缀
    if (id != undefined && cfg != undefined) {
        let index = devices.findIndex((ele) => {
            return ele.device_id == id;
        });
        if (index != -1) {

            var ids = id.substr(0, 6);
            var masterId = masterAttr.findIndex((ele) => {
                return ele == ids;
            })
            var gatewayId = gatewayAttr.findIndex((ele) => {
                return ele == ids;
            })
            let order = ">>wfile," + cfg;
            if (masterId != -1) {
                mqttPubOrderResp(`/device/${id}/sys`, order, 1, (ret, msg) => {
                    if (ret == 0) {
                        console.log(msg);
                        res.status(200).send(msg);
                    }
                    else {
                        res.status(500).send(msg);
                    }
                });
            }
            if (gatewayId != -1) {
                mqttPubOrderResp(`/gateway/${id}/sys`, order, 1, (ret, msg) => {
                    if (ret == 0) {
                        console.log(msg);
                        res.status(200).send(msg);
                    }
                    else {
                        res.status(500).send(msg);
                    }
                });
            }
        }
        else {
            res.status(404).send('device not exist');
        }
    }
    else {
        res.status(500).send('wrong param');
    }
})
webServer.post('/device/luaStart', (req, res, next) => {
    let id = req.body.data.id;
    if (id != undefined) {
        let index = devices.findIndex((ele) => {
            return ele.device_id == id;
        });
        console.log(index)
        if (index != -1) {

            var ids = id.substr(0, 6);
            var masterId = masterAttr.findIndex((ele) => {
                return ele == ids;
            })
            var gatewayId = gatewayAttr.findIndex((ele) => {
                return ele == ids;
            })
            var slaveId = slaveAttr.findIndex((ele) => {
                return ele == ids;
            })
            console.log("ids:" + ids + "========masterId:" + masterId + "====================slaveId:" + gatewayId)
            if (masterId != -1) {
                console.log("master==lua.start")
                mqttPubOrderResp(`/device/${id}/sys`, '>>luavm,start', 1, (ret, msg) => {
                    if (ret == 0) {
                        console.log(msg);
                        res.status(200).send(msg);
                    }
                    else {
                        res.status(500).send(msg);
                    }
                });
            }
            if (gatewayId != -1 || slaveId != -1) {
                console.log("gateway==lua.start")
                mqttPubOrderResp(`/gateway/${id}/sys`, '>>luavm,start', 1, (ret, msg) => {
                    if (ret == 0) {
                        console.log(msg);
                        res.status(200).send(msg);
                    }
                    else {
                        res.status(500).send(msg);
                    }
                });
            }
        }
        else {
            res.status(404).send('device not exist');
        }
    }
    else {
        res.status(500).send('wrong param');
    }
})

webServer.post('/device/luaReset', (req, res, next) => {
    let id = req.body.data.id;
    if (id != undefined) {
        let index = devices.findIndex((ele) => {
            return ele.device_id == id;
        });
        console.log(index)
        if (index != -1) {

            var ids = id.substr(0, 6);
            var masterId = masterAttr.findIndex((ele) => {
                return ele == ids;
            })
            var gatewayId = gatewayAttr.findIndex((ele) => {
                return ele == ids;
            })
            var slaveId = slaveAttr.findIndex((ele) => {
                return ele == ids;
            })
            console.log("ids:" + ids + "========masterId:" + masterId + "====================slaveId:" + gatewayId)
            if (masterId != -1) {
                console.log("master==lua.reset")
                mqttPubOrderResp(`/device/${id}/sys`, '>>luavm,restart', 1, (ret, msg) => {
                    if (ret == 0) {
                        console.log(msg);
                        res.status(200).send(msg);
                    }
                    else {
                        res.status(500).send(msg);
                    }
                });
            }
            if (gatewayId != -1 || slaveId != -1) {
                console.log("gateway==lua.start")
                mqttPubOrderResp(`/gateway/${id}/sys`, '>>luavm,restart', 1, (ret, msg) => {
                    if (ret == 0) {
                        console.log(msg);
                        res.status(200).send(msg);
                    }
                    else {
                        res.status(500).send(msg);
                    }
                });
            }
        }
        else {
            res.status(404).send('device not exist');
        }
    }
    else {
        res.status(500).send('wrong param');
    }
})


webServer.post('/device/luaStop', (req, res, next) => {
    let id = req.body.data.id;
    if (id != undefined) {
        let index = devices.findIndex((ele) => {
            return ele.device_id == id;
        });
        console.log(index)
        if (index != -1) {

            var ids = id.substr(0, 6);
            var masterId = masterAttr.findIndex((ele) => {
                return ele == ids;
            })
            var gatewayId = gatewayAttr.findIndex((ele) => {
                return ele == ids;
            })
            var slaveId = slaveAttr.findIndex((ele) => {
                return ele == ids;
            })
            console.log("ids:" + ids + "========masterId:" + masterId + "====================slaveId:" + gatewayId)
            if (masterId != -1) {
                console.log("master==lua.stop")
                mqttPubOrderResp(`/device/${id}/sys`, '>>luavm,stop', 1, (ret, msg) => {
                    if (ret == 0) {
                        console.log(msg);
                        res.status(200).send(msg);
                    }
                    else {
                        res.status(500).send(msg);
                    }
                });
            }
            if (gatewayId != -1 || slaveId != -1) {
                console.log("gateway==lua.stop")
                mqttPubOrderResp(`/gateway/${id}/sys`, '>>luavm,stop', 1, (ret, msg) => {
                    if (ret == 0) {
                        console.log(msg);
                        res.status(200).send(msg);
                    }
                    else {
                        res.status(500).send(msg);
                    }
                });
            }
        }
        else {
            res.status(404).send('device not exist');
        }
    }
    else {
        res.status(500).send('wrong param');
    }
})

webServer.post('/device/luaSearch', (req, res, next) => {
    let id = req.body.data.id;
    if (id != undefined) {
        let index = devices.findIndex((ele) => {
            return ele.device_id == id;
        });
        console.log(index)
        if (index != -1) {

            var ids = id.substr(0, 6);
            var masterId = masterAttr.findIndex((ele) => {
                return ele == ids;
            })
            var gatewayId = gatewayAttr.findIndex((ele) => {
                return ele == ids;
            })
            var slaveId = slaveAttr.findIndex((ele) => {
                return ele == ids;
            })
            // console.log("ids:" + ids + "========masterId:" + masterId + "====================slaveId:" + gatewayId)
            if (masterId != -1) {
                console.log("master==lua.search")
                mqttPubOrderResp(`/device/${id}/sys`, '>>luavm,state', 1, (ret, msg) => {
                    if (ret == 0) {
                        console.log(msg);
                        res.status(200).send(msg);
                    }
                    else {
                        res.status(500).send(msg);
                    }
                });
            }
            if (gatewayId != -1 || slaveId != -1) {
                console.log("gateway==lua.search")
                mqttPubOrderResp(`/gateway/${id}/sys`, '>>luavm,state', 1, (ret, msg) => {
                    console.log(ret, "ret", msg, "search=====================================");
                    if (ret == 0) {
                        res.status(200).send(msg);
                    }
                    else {
                        res.status(500).send(msg);
                    }
                });
            }
        }
        else {
            res.status(404).send('device not exist');
        }
    }
    else {
        res.status(500).send('wrong param');
    }
})


webServer.post('/device/luaError', (req, res, next) => {
    let id = req.body.data.id;
    if (id != undefined) {
        let index = devices.findIndex((ele) => {
            return ele.device_id == id;
        });
        console.log(index)
        if (index != -1) {

            var ids = id.substr(0, 6);
            var masterId = masterAttr.findIndex((ele) => {
                return ele == ids;
            })
            var gatewayId = gatewayAttr.findIndex((ele) => {
                return ele == ids;
            })
            var slaveId = slaveAttr.findIndex((ele) => {
                return ele == ids;
            })
            console.log("ids:" + ids + "========masterId:" + masterId + "====================slaveId:" + gatewayId)
            if (masterId != -1) {
                console.log("master==lua.error")
                mqttPubOrderResp(`/device/${id}/sys`, '>>luavm,error', 1, (ret, msg) => {
                    if (ret == 0) {
                        console.log(msg);
                        res.status(200).send(msg);
                    }
                    else {
                        res.status(500).send(msg);
                    }
                });
            }
            if (gatewayId != -1 || slaveId != -1) {
                console.log("gateway==lua.error")
                mqttPubOrderResp(`/gateway/${id}/sys`, '>>luavm,error', 1, (ret, msg) => {
                    if (ret == 0) {
                        console.log(msg, "error====================");
                        res.status(200).send(msg);
                    }
                    else {
                        res.status(500).send(msg);
                    }
                });
            }
        }
        else {
            res.status(404).send('device not exist');
        }
    }
    else {
        res.status(500).send('wrong param');
    }
})

webServer.post('/device/sysReboot', (req, res, next) => {
    let id = req.body.data.id;
    if (id != undefined) {
        let index = devices.findIndex((ele) => {
            return ele.device_id == id;
        });
        console.log(index)
        if (index != -1) {

            var ids = id.substr(0, 6);
            var masterId = masterAttr.findIndex((ele) => {
                return ele == ids;
            })
            var gatewayId = gatewayAttr.findIndex((ele) => {
                return ele == ids;
            })
            var slaveId = slaveAttr.findIndex((ele) => {
                return ele == ids;
            })
            if (masterId != -1) {
                console.log("master==lua.sysReboot")
                mqttPubOrderResp(`/device/${id}/sys`, '>>reboot', 1, (ret, msg) => {
                    if (ret == 0) {
                        console.log(msg);
                        res.status(200).send(msg);
                    }
                    else {
                        res.status(500).send(msg);
                    }
                });
            }
            if (gatewayId != -1 || slaveId != -1) {
                console.log("gateway==lua.sysReboot")
                mqttPubOrderResp(`/gateway/${id}/sys`, '>>reboot', 1, (ret, msg) => {
                    if (ret == 0) {
                        console.log(msg);
                        res.status(200).send(msg);
                    }
                    else {
                        res.status(500).send(msg);
                    }
                });
            }
        }
        else {
            res.status(404).send('device not exist');
        }
    }
    else {
        res.status(500).send('wrong param');
    }
})

// // SSE(Server-sent Events) 推送
// let sseRes;
// webServer.get('/sse', function (req, res, next) {
//     sseRes = res;
//     res.header("Content-Type", "text/event-stream");
//     res.header("Cache-Control", "no-cache,no-transform");
//     res.header("Connection", "keep-alive");
//     res.header("X-Accel-Buffering", "no");

//     res.write("retry: 5000\n\n")
// });


// MQTT 订阅
function mqttSub(id, callback) {
    if (!(callback instanceof Function)) {
        let e = new Error();
        e.number = 1;
        e.message = 'invalid param type';
        throw e;
    }
    // 判断是否已成功连接
    if (client.connected) {
        let topics = [
            `/device/${id}/cmd_resp`,
            `/device/${id}/report`,
            `/device/${id}/sys_resp`,
                `/device/online`,
            `/device/willmsg`,
        ];
        client.subscribe(topics, { qos: 1 }, (error) => {
            if (error) {
                console.log(error);
                callback(-1, error);
            }
            else {
                console.log(`Subscribe [${id}] successful.`);
                callback(0);
            }
        });
    } else {
        console.log('Client has NOT connected!');
        callback(-2, 'Client has NOT connected!');
    }
}

// MQTT 订阅 从设备
function mqttSlaveSub(id, callback) {
    if (!(callback instanceof Function)) {
        let e = new Error();
        e.number = 1;
        e.message = 'invalid param type';
        throw e;
    }
    // 判断是否已成功连接
    if (client.connected) {
        let topics = [
            `/gateway/${id}/cmd_resp`,
            `/gateway/${id}/report`,
            `/gateway/${id}/+/cmd_resp`,
            `/gateway/${id}/+/report`,
            `/gateway/${id}/sys_resp`,
            `/gateway/online`,
            `/gateway/willmsg`,
        ];
        client.subscribe(topics, { qos: 1 }, (error) => {
            if (error) {
                console.log(error);
                callback(-1, error);
            }
            else {
                console.log(`Subscribe [${id}] successful.`);
                callback(0);
            }
        });
    } else {
        console.log('Client has NOT connected!');
        callback(-2, 'Client has NOT connected!');
    }
}

// MQTT 取消订阅
function mqttUnsub(id, callback) {
    if (!(callback instanceof Function)) {
        let e = new Error();
        e.number = 1;
        e.message = 'invalid param type';
        throw e;
    }
    // 判断是否已成功连接
    if (client.connected) {
        let topics = [
            `/device/${id}/cmd_resp`,
            `/device/${id}/report`,
        ];
        client.unsubscribe(topics, (error) => {
            if (error) {
                console.log(error)
                callback(-1, error);
            }
            else {
                console.log(`Unsubscribe [${id}] successful.`);
                callback(0);
            }
        });
    } else {
        console.log('Client has NOT connected!');
        callback(-2, 'Client has NOT connected!');
    }
}

// MQTT 发布消息
function mqttPub(topic, payload, qos, callback) {
    if (!(callback instanceof Function)) {
        let e = new Error();
        e.number = 1;
        e.message = 'invalid param type';
        throw e;
    }
    // 判断是否已成功连接
    if (client.connected) {
        client.publish(topic, payload, { qos: qos }, (error) => {
            if (error) {
                console.log(error)
                callback(-1, error);
            }
            else {
                console.log(`Publish [${payload}] on [${topic}] successful.`);
                callback(0);
            }
        });
    } else {
        console.log('Client has NOT connected!');
        callback(-2, 'Client has NOT connected!');
    }
}

// MQTT 发布消息
function mqttPubWaitResp(topic, payload, qos, callback) {
    if (!(callback instanceof Function)) {
        let e = new Error();
        e.number = 1;
        e.message = 'invalid param type';
        throw e;
    }
    let topicArr = topic.split('/');
    let id = topicArr[topicArr.length - 2];
    // console.log("payload:lua=====" + payload)
    let jsonPayload = JSON.parse(payload);

    let isCallCallback = false;
    // 判断是否已成功连接
    if (client.connected) {
        client.publish(topic, payload, { qos: qos }, (error) => {
            if (error) {
                console.log(error)
                callback(-1, error);
                isCallCallback = true;
            }
            else {
                // console.log(eventMqttResp.listeners(`${id}.${jsonPayload.msgid}.timeout`).length, "监听事件1")

                console.log(`mqttPubWaitResp:Publish [${payload}] on [${topic}] successful.`);

                let onceInfo = (ret) => {
                    eventMqttResp.removeListener(`${id}.${jsonPayload.msgid}.timeout`, timeoutOnce);
                    console.log("响应方法异步1：========================")
                    if (isCallCallback == false) {
                        isCallCallback = true;
                        if (ret.status == 'ok') {
                            callback(0, ret.data);
                        }
                        else {
                            callback(-3, ret.data);
                        }
                    }
                }

                console.log(`${id}.${jsonPayload.msgid}`,"==========")

                eventMqttResp.once(`${id}.${jsonPayload.msgid}`, onceInfo);
                // console.log(eventMqttResp.listenerCount(`${id}.${jsonPayload.msgid}.timeout`), "count2")

                let timeoutOnce = () => {
                    eventMqttResp.removeListener(`${id}.${jsonPayload.msgid}`, onceInfo);
                    console.log("响应方法异步2：========================")
                    if (isCallCallback == false) {
                        isCallCallback = true;
                        callback(-4, 'timeout');
                    }
                }
                eventMqttResp.once(`${id}.${jsonPayload.msgid}.timeout`, timeoutOnce);

                setTimeout(() => {
                    console.log("响应方法异步3：========================")
                    eventMqttResp.emit(`${id}.${jsonPayload.msgid}.timeout`);
                }, 5000);
                // console.log(eventMqttResp.listeners(`${id}.${jsonPayload.msgid}.timeout`).length, "监听事件2")

            }
        });
    } else {
        console.log('Client has NOT connected!');
        callback(-2, 'Client has NOT connected!');
    }

}


// MQTT 发布消息 lua
function mqttPubOrderResp(topic, payload, qos, callback) {
    if (!(callback instanceof Function)) {
        let e = new Error();
        e.number = 1;
        e.message = 'invalid param type';
        throw e;
    }
    let topicArr = topic.split('/');
    let id = topicArr[2];
    randomId = Math.random().toString(36).substr(2);
    // let randomId = Math.random().toString(36).substr(2);
    console.log("payload:lua=====" + payload.toString(), "mqttPubOrderResp随机数：", randomId)

    let isCallCallback = false;
    // 判断是否已成功连接
    if (client.connected) {
        client.publish(topic, payload, { qos: qos }, (error) => {
            if (error) {
                console.log(error)
                callback(-1, error);
                isCallCallback = true;
            }
            else {
                // console.log(`mqttPubOrderResp：Publish [${payload}] on [${topic}] successful.`);
                let onceInfo = (ret) => {
                    eventMqttResp.removeListener(`${id}.${randomId}.timeout`, onceTimeout);
                    console.log("命令once=========", payload)
                    if (isCallCallback == false) {
                        isCallCallback = true;
                        let retAttr = ret.split(",");
                        console.log("命令发布消息：", ret, "retAttr", retAttr, "retAttr[0]", retAttr[0])
                        if (retAttr[0] == '<<0') {
                            console.log('success')
                            callback(0, retAttr[1])
                        } else {
                            console.log('error')
                            callback(0, retAttr[1])
                        }
                    }
                }
                eventMqttResp.once(`${id}.${randomId}`, onceInfo);

                let onceTimeout = () => {
                    eventMqttResp.removeListener(`${id}.${randomId}`, onceInfo);
                    console.log("命令once.timeout=========")
                    if (isCallCallback == false) {
                        isCallCallback = true;
                        callback(-4, 'timeout');
                    }
                }
                eventMqttResp.once(`${id}.${randomId}.timeout`, onceTimeout);
                setTimeout(() => {
                    // console.log("命令setTimeout==============")
                    eventMqttResp.emit(`${id}.${randomId}.timeout`);
                }, 5000);
            }
        });
    } else {
        console.log('Client has NOT connected!');
        callback(-2, 'Client has NOT connected!');
    }

}


var idMap = new Map();//从设备id:网关id   关系 key:value

/**
 * 查询从设备信息
 * @param {*} id 
 * @param {*} callback 
 */
function slaveList(id, callback) {
    // 判断是否已成功连接
    if (client.connected) {

        let mqttReq = {
            version: MQTT_JSON_API_VERSION,
            msgid: `${mqttMsgID++}`,
            method: 'slave.list',
            data: {},
            time: `${(new Date()).Format("yyyyMMddhhmmss")}`
        }
        mqttPubWaitResp(`/gateway/${id}/cmd`, JSON.stringify(mqttReq), 1, (ret, msg) => {
            var slaves = JSON.stringify(msg).split(":");
            var timeoutAttr = slaves[0].split('"');
            console.log("slaveList:", slaves, "slaves[0]", "timeoutAttr:", timeoutAttr + "timeoutAttr[1]", timeoutAttr[1], slaves[0] != "timeout")
            if (timeoutAttr[1] != "timeout") {

                var slavesStr = slaves[1].substr(0, slaves[1].length - 1);

                var slavesAttr = [];
                slavesStr = slavesStr.slice(1, slavesStr.length - 1);
                slavesAttr = slavesStr.split(',');

                if(slaves[1] != "{}}"){ 
                     for (let i = 0; i < slavesAttr.length; i++) {
                    var element = slavesAttr[i];
                    var deviceId = element.substr(1, element.length - 2);

                    idMap.set(deviceId, id);
                    let idx = deviceId.substr(0, 6);

                    let indexs = slaveAttr.findIndex((ele) => {
                        return idx == ele;
                    })
                    console.log("indexs:",indexs,"idx:",idx)
                    switchNum = slaveDeviceInfo[indexs][idx];
                    // console.log("slaveList:num:", switchNum)
                    devices.push(initDevice(deviceId, "是", switchNum));
                    callback(0, "从设备数据查询成功");

                }}
                // console.log(slavesAttr + "======================================")
              
            } else {
                callback(-4, "从设备数据查询超时");
            }
        });

    } else {
        console.log('Client has NOT connected!');
        callback(-2, 'Client has NOT connected!');
    }
}



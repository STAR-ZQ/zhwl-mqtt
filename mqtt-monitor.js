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

const mqttOptions = {
    clientId: 'test',
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


    handleReceivedMqttMsg(topic, payload);
});


let devices = new Array();
const MQTT_JSON_API_VERSION = '2.0.0';
let mqttMsgID = 1;
var masterAttr = new Array("010201");
var gatewayAttr = new Array("010401");
var slaveAttr = new Array("010301");


function handleReceivedMqttMsg(topic, payload) {
    let topicArr = topic.split('/');
    let id = topicArr[2];
    let jsonPayload = JSON.parse(payload);

    let srcmsgid = Number(jsonPayload.srcmsgid)
    let data = jsonPayload.data;
    console.log("测试是否进入响应方法");
    var lastWord = topicArr[topicArr.length - 1];
    if (lastWord == 'cmd' || lastWord == 'cmd_resp') {
        eventMqttResp.emit(`${Number(id)}.${srcmsgid}`, jsonPayload);
    }

    eventMqttResp.emit(`device_report`, id, data);
}

eventMqttResp.on('device_report', (id, data) => {
    if (data != undefined) {
        let device;
        let idx = devices.findIndex((ele) => {
            return ele.device_id == id;
        });
        if (idx != -1) {
            device = devices[idx];

            if (data.tags != undefined) {
                console.log(data.tags);
                data.tags.forEach(element => {
                    switch (element.tag) {
                        case "voltage":
                            {
                                let obj;
                                let tagObj = device.voltage;

                                let tIndex = tagObj.findIndex((ele) => {
                                    return ele.line_id == Number(element.line_id);
                                });
                                if (tIndex != -1) {
                                    obj = tagObj[tIndex];
                                    obj.line_id = Number(element.line_id);
                                    obj.value = Number(element.value);
                                }
                                else {
                                    obj = {
                                        line_id: 0,
                                        value: 0
                                    }
                                    obj.line_id = Number(element.line_id);
                                    obj.value = Number(element.value);
                                    tagObj.push(obj);
                                }
                            }
                            break;
                        case "current":
                            {
                                let obj;
                                let tagObj = device.current;

                                let tIndex = tagObj.findIndex((ele) => {
                                    return ele.line_id == Number(element.line_id);
                                });
                                if (tIndex != -1) {
                                    obj = tagObj[tIndex];
                                    obj.line_id = Number(element.line_id);
                                    obj.value = Number(element.value);
                                }
                                else {
                                    obj = {
                                        line_id: 0,
                                        value: 0
                                    }
                                    obj.line_id = Number(element.line_id);
                                    obj.value = Number(element.value);
                                    tagObj.push(obj);
                                }
                            }
                            break;
                        case "frequency":
                            {
                                let obj;
                                let tagObj = device.frequency;

                                let tIndex = tagObj.findIndex((ele) => {
                                    return ele.line_id == Number(element.line_id);
                                });
                                if (tIndex != -1) {
                                    obj = tagObj[tIndex];
                                    obj.line_id = Number(element.line_id);
                                    obj.value = Number(element.value);
                                }
                                else {
                                    obj = {
                                        line_id: 0,
                                        value: 0
                                    }
                                    obj.line_id = Number(element.line_id);
                                    obj.value = Number(element.value);
                                    tagObj.push(obj);
                                }
                            }
                            break;
                        case "leak_current":
                            {
                                let obj;
                                let tagObj = device.leak_current;

                                let tIndex = tagObj.findIndex((ele) => {
                                    return ele.line_id == Number(element.line_id);
                                });
                                if (tIndex != -1) {
                                    obj = tagObj[tIndex];
                                    obj.line_id = Number(element.line_id);
                                    obj.value = Number(element.value);
                                }
                                else {
                                    obj = {
                                        line_id: 0,
                                        value: 0
                                    }
                                    obj.line_id = Number(element.line_id);
                                    obj.value = Number(element.value);
                                    tagObj.push(obj);
                                }
                            }
                            break;
                        case "power_p":
                            {
                                let obj;
                                let tagObj = device.power_p;

                                let tIndex = tagObj.findIndex((ele) => {
                                    return ele.line_id == Number(element.line_id);
                                });
                                if (tIndex != -1) {
                                    obj = tagObj[tIndex];
                                    obj.line_id = Number(element.line_id);
                                    obj.value = Number(element.value);
                                }
                                else {
                                    obj = {
                                        line_id: 0,
                                        value: 0
                                    }
                                    obj.line_id = Number(element.line_id);
                                    obj.value = Number(element.value);
                                    tagObj.push(obj);
                                }
                            }
                            break;
                        case "power_q":
                            {
                                let obj;
                                let tagObj = device.power_q;

                                let tIndex = tagObj.findIndex((ele) => {
                                    return ele.line_id == Number(element.line_id);
                                });
                                if (tIndex != -1) {
                                    obj = tagObj[tIndex];
                                    obj.line_id = Number(element.line_id);
                                    obj.value = Number(element.value);
                                }
                                else {
                                    obj = {
                                        line_id: 0,
                                        value: 0
                                    }
                                    obj.line_id = Number(element.line_id);
                                    obj.value = Number(element.value);
                                    tagObj.push(obj);
                                }
                            }
                            break;
                        case "power_s":
                            {
                                let obj;
                                let tagObj = device.power_s;

                                let tIndex = tagObj.findIndex((ele) => {
                                    return ele.line_id == Number(element.line_id);
                                });
                                if (tIndex != -1) {
                                    obj = tagObj[tIndex];
                                    obj.line_id = Number(element.line_id);
                                    obj.value = Number(element.value);
                                }
                                else {
                                    obj = {
                                        line_id: 0,
                                        value: 0
                                    }
                                    obj.line_id = Number(element.line_id);
                                    obj.value = Number(element.value);
                                    tagObj.push(obj);
                                }
                            }
                            break;
                        case "energy_p":
                            {
                                let obj;
                                let tagObj = device.energy_p;

                                let tIndex = tagObj.findIndex((ele) => {
                                    return ele.line_id == Number(element.line_id);
                                });
                                if (tIndex != -1) {
                                    obj = tagObj[tIndex];
                                    obj.line_id = Number(element.line_id);
                                    obj.value = Number(element.value);
                                }
                                else {
                                    obj = {
                                        line_id: 0,
                                        value: 0
                                    }
                                    obj.line_id = Number(element.line_id);
                                    obj.value = Number(element.value);
                                    tagObj.push(obj);
                                }
                            }
                            break;
                        case "energy_q":
                            {
                                let obj;
                                let tagObj = device.energy_q;

                                let tIndex = tagObj.findIndex((ele) => {
                                    return ele.line_id == Number(element.line_id);
                                });
                                if (tIndex != -1) {
                                    obj = tagObj[tIndex];
                                    obj.line_id = Number(element.line_id);
                                    obj.value = Number(element.value);
                                }
                                else {
                                    obj = {
                                        line_id: 0,
                                        value: 0
                                    }
                                    obj.line_id = Number(element.line_id);
                                    obj.value = Number(element.value);
                                    tagObj.push(obj);
                                }
                            }
                            break;
                        case "switch_state":
                            {
                                let obj;
                                let tagObj = device.switch_state;

                                let tIndex = tagObj.findIndex((ele) => {
                                    return ele.line_id == Number(element.line_id);
                                });
                                if (tIndex != -1) {
                                    obj = tagObj[tIndex];
                                    obj.line_id = Number(element.line_id);
                                    obj.value = element.value;
                                }
                                else {
                                    obj = {
                                        line_id: 0,
                                        value: 0
                                    }
                                    obj.line_id = Number(element.line_id);
                                    obj.value = element.value;
                                    tagObj.push(obj);
                                }
                            }
                            break;
                        case "pwm_state":
                            device.pwm_state = Number(element.value);
                            break;
                        case "v0_10_state":
                            device.v0_10_state = Number(element.value);
                            break;
                        case "tilt":
                            device.tilt = Number(element.value);
                            break;
                        case "signal":
                            device.signal = Number(element.value);
                            break;
                    }
                });
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

function initDevice(id, isFlag) {
    device = {
        device_id: id,
        isSlaveDevice: isFlag,//是否从设备装置
        voltage: [], // 电压
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
            devices.push(initDevice(id, "否"));
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
                mqttSub(id, (ret, err) => {
                    if (ret == 0) {
                        res.status(201).send('success');
                    }
                    else {
                        res.status(500).send(err);
                    }
                });
            } else if (gatewayId != -1) {
                console.log("从设备===================");
                mqttSlaveSub(id, (ret, err) => {
                    if (ret == 0) {
                        res.status(200).send('success');
                    }
                    else {
                        res.status(500).send(err);
                    }
                });
                slaveList(id, (ret, err) => {
                    console.log("end info ============" + ret);
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
    let action_id = req.body.action_id;
    let action = req.body.action;
    if (id != undefined && action_type != undefined && action_id != undefined && action != undefined) {
        let index = devices.findIndex((ele) => {
            return ele.device_id == id;
        });
        if (index != -1) {
            let mqttReq = {
                version: MQTT_JSON_API_VERSION,
                msgid: `${mqttMsgID++}`,
                method: 'act.do',
                data: { [action_type]: { [`${action_id}`]: `${action}` } },
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

            console.log("id前六位：" + ids);
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
            } else if (gatewayId != -1) {
                console.log("从设备===================");
                mqttPub(`/gateway/${id}/cmd`, JSON.stringify(mqttReq), 1, (ret, err) => {
                    if (ret == 0) {
                        res.status(200).send('success');
                    }
                    else {
                        res.status(500).send(err);
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
});

webServer.put('/device/tag', (req, res, next) => {
    //console.log(req.body);
    let id = req.body.id;
    let tag = req.body.tag;
    if (id != undefined && tag != undefined) {
        let index = devices.findIndex((ele) => {
            return ele.device_id == id;
        });
        if (index != -1) {
            let mqttReq = {
                version: MQTT_JSON_API_VERSION,
                msgid: `${mqttMsgID++}`,
                method: tag == 'all' ? 'tag.get.all' : 'tag.get.part',
                data: tag == 'all' ? {} : { 'tags': [`${tag}`] },
                time: `${(new Date()).Format("yyyyMMddhhmmss")}`
            }
            var ids = id.substr(0, 6);
            var masterId = masterAttr.findIndex((ele) => {
                return ele == ids;
            })
            var gatewayId = gatewayAttr.findIndex((ele) => {
                return ele == ids;
            })
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
            if (gatewayId != -1) {
                mqttPub(`/gateway/${id}/cmd`, JSON.stringify(mqttReq), 1, (ret, err) => {
                    if (ret == 0) {
                        res.status(201).send('success');
                    }
                    else {
                        res.status(500).send(err);
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
                data: { file: `${cfg}` },
                time: `${(new Date()).Format("yyyyMMddhhmmss")}`
            }
            var ids = id.substr(0, 6);
            var masterId = masterAttr.findIndex((ele) => {
                return ele == ids;
            })
            var gatewayId = gatewayAttr.findIndex((ele) => {
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
            if (gatewayId != -1) {
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
            if (gatewayId != -1) {
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
        else {
            res.status(404).send('device not exist');
        }
    }
    else {
        res.status(500).send('wrong param');
    }
});


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
    let id = topicArr[2];
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
                console.log(`Publish [${payload}] on [${topic}] successful.`);
                eventMqttResp.once(`${Number(id)}.${jsonPayload.msgid}`, (ret) => {
                    eventMqttResp.removeListener(`${Number(id)}.${jsonPayload.msgid}.timeout`, () => { });
                    if (isCallCallback == false) {
                        isCallCallback = true;

                        if (ret.status == 'ok') {
                            callback(0, ret.data);
                        }
                        else {
                            callback(-3, ret.data);
                        }
                    }
                });
                eventMqttResp.once(`${Number(id)}.${jsonPayload.msgid}.timeout`, () => {
                    eventMqttResp.removeListener(`${Number(id)}.${jsonPayload.msgid}`, () => { });
                    if (isCallCallback == false) {
                        isCallCallback = true;
                        callback(-4, 'timeout');
                    }
                });
                setTimeout(() => {
                    eventMqttResp.emit(`${Number(id)}.${jsonPayload.msgid}.timeout`);
                }, 5000);
            }
        });
    } else {
        console.log('Client has NOT connected!');
        callback(-2, 'Client has NOT connected!');
    }

}
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
            var slavesStr = slaves[1].substr(0, slaves[1].length - 1);

            var slavesAttr = [];
            slavesStr = slavesStr.slice(1, slavesStr.length - 1);
            slavesAttr = slavesStr.split(',');

            for (let i = 0; i < slavesAttr.length; i++) {
                var element = slavesAttr[i];
                var deviceId = element.substr(1, element.length - 2);

                devices.push(initDevice(deviceId, "是"));
            }
        });
        callback(0, "从设备数据查询成功");

    } else {
        console.log('Client has NOT connected!');
        callback(-2, 'Client has NOT connected!');
    }
}



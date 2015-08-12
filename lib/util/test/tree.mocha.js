"use strict";

/*globals describe, it*/

var 
	assert = require('assert'),
	Tree = require('../tree.js');

describe('tree', function(){
	
	it('- sort tree', function(){
		
		var obj = {"os":{"family":{"Other":{},"Panasonic":{"major":{"2012":{}}},"Symbian OS":{"major":{"9":{"minor":{"4":{}}}}},"Android":{"major":{"4":{"minor":{"2":{}}}}},"Windows":{}}},"ua":{"family":{"Obigo":{},"HbbTV":{"major":{"1":{"minor":{"1":{}}}}},"Nokia Browser":{"major":{"7":{"minor":{"0":{}}}}},"Chrome Mobile":{"major":{"18":{"minor":{"0":{}}}}},"Android":{"major":{"4":{"minor":{"2":{}}}}},"IE":{"major":{"4":{"minor":{"01":{}}}}}}},"device":{"family":{"HbbTV":{}},"brand":{"Alcatel":{"model":{"OT510A":{}}},"Panasonic":{"model":{"VIERA 2012":{}}},"Nokia":{"model":{"5800d-1":{}}},"Samsung":{"model":{"Galaxy Nexus":{}}},"HTC":{"model":{"Vision":{},"One":{}}},"Huawei":{"model":{"G610-U00":{}}},"":{}}}};

		var tree = new Tree();

		var result = tree.sort(obj);
		
		var expected =   {
			"os": {
				"family": {
					"Android": {
						"major": {
							"4": {
								"minor": {
									"2": {}
								}
							}
						}
					},
					"Other": {},
					"Panasonic": {
						"major": {
							"2012": {}
						}
					},
					"Symbian OS": {
						"major": {
							"9": {
								"minor": {
									"4": {}
								}
							}
						}
					},
					"Windows": {}
				}
			},
			"ua": {
				"family": {
					"Android": {
						"major": {
							"4": {
								"minor": {
									"2": {}
								}
							}
						}
					},
					"Chrome Mobile": {
						"major": {
							"18": {
								"minor": {
									"0": {}
								}
							}
						}
					},
					"HbbTV": {
						"major": {
							"1": {
								"minor": {
									"1": {}
								}
							}
						}
					},
					"IE": {
						"major": {
							"4": {
								"minor": {
									"01": {}
								}
							}
						}
					},
					"Nokia Browser": {
						"major": {
							"7": {
								"minor": {
									"0": {}
								}
							}
						}
					},
					"Obigo": {}
				}
			},
			"device": {
				"family": {
					"HbbTV": {}
				},
				"brand": {
					"": {},
					"Alcatel": {
						"model": {
							"OT510A": {}
						}
					},
					"HTC": {
						"model": {
							"One": {},
							"Vision": {}
						}
					},
					"Huawei": {
						"model": {
							"G610-U00": {}
						}
					},
					"Nokia": {
						"model": {
							"5800d-1": {}
						}
					},
					"Panasonic": {
						"model": {
							"VIERA 2012": {}
						}
					},
					"Samsung": {
						"model": {
							"Galaxy Nexus": {}
						}
					}
				}
			}
		};
		
		assert.deepEqual(result, expected);
	});
	
	describe('- add parsing results to the tree', function(){ 

		var parsed = [
			{
				"string": "ALCATEL-OT510A/382 ObigoInternetBrowser/Q05A",
				"ua": {
					"family":	"Obigo",
					"major": null,
					"minor": null
				},
				"os": {
					"family":	"Other",
					"major": null,
					"minor": null
				},
				"device": {
					"family":	"Alcatel OT510A",
					"brand":	"Alcatel",
					"model":	"OT510A"
				}
			},
			{
				"string":	"HbbTV/1.1.1 (;Panasonic;VIERA 2012;1.261;0071-3103 2000-0000;)",
				"ua": {
					"family":	"HbbTV",
					"major":	"1",
					"minor":	"1"
				},
				"os": {
					"family":	"Panasonic",
					"major":	"2012",
					"minor": null
				},
				"device": {
					"family":	"HbbTV",
					"brand":	"Panasonic",
					"model":	"VIERA 2012"
				}
			},
			{
				"string":	"Mozilla/5.0 (SymbianOS/9.4; U; Series60/5.0 Nokia5800d-1/21.0.025; Profile/MIDP-2.1 Configuration/CLDC-1.1 ) AppleWebKit/413 (KHTML, like Gecko) Safari/413",
				"ua": {
					"family":	"Nokia Browser",
					"major":	"7",
					"minor":	"0"
				},
				"os": {
					"family":	"Symbian OS",
					"major":	"9",
					"minor":	"4"
				},
				"device": {
					"family":	"Nokia 5800d-1",
					"brand":	"Nokia",
					"model":	"5800d-1"
				}
			}
		];
		var tree = new Tree();
		parsed.forEach(function(p){
			tree.add(p);
		});

		it('- return size', function(){
			var result = tree.size(),
				expected = 3;
			
			assert.equal(result, expected);
		});
		
		it('- get sorted result', function(){
			
			var result;
			var expected = {
				"info": {
					"processed_user_agents": 3
				},
				"os": {
					"family": {
						"Other": {},
						"Panasonic": {
							"major": {
								"2012": {}
							}
						},
						"Symbian OS": {
							"major": {
								"9": {
									"minor": {
										"4": {}
									}
								}
							}
						}
					}
				},
				"ua": {
					"family": {
						"HbbTV": {
							"major": {
								"1": {
									"minor": {
										"1": {}
									}
								}
							}
						},
						"Nokia Browser": {
							"major": {
								"7": {
									"minor": {
										"0": {}
									}
								}
							}
						},
						"Obigo": {}
					}
				},
				"device": {
					"family": {
						"HbbTV": {}
					},
					"brand": {
						"Alcatel": {
							"model": {
								"OT510A": {}
							}
						},
						"Nokia": {
							"model": {
								"5800d-1": {}
							}
						},
						"Panasonic": {
							"model": {
								"VIERA 2012": {}
							}
						}
					}
				}
			};
			
			result = tree.obtain();
			
			//~ console.log(JSON.stringify(result));
			//~ console.log(JSON.stringify(expected));
			
			assert.deepEqual(result, expected);
		});
	});
});

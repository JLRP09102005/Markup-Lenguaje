//Cube thene WCCC - surface sneks

//making paths within a 3d grid, such that it renders a cube. Paths try to fill out the available area on the 2d faces of a cube. When the whole surface is claimed and they cannot
//find a path they go deeper one layer into the cube, and fill out the newly available surfaces of the nested cube. 
//removing older lines (controlled by lineTrimLength) greatly improves performance but the cube shape is less apparent. 


const gridSize = 10;  //distance between grid points
let cubeFaceSize = 400;  //largest size cube
let cols = 60;  //size of claims array
let cpts;
let cfaces;

let nextFacesU;
let nextFacesV;
let prevFacesU;
let prevFacesV;

let lockedAxis;

let cubeCursors = [];

let claims = [];

let lineTrimLength = 100;  //maximum size line to keep (0 is unlimited)

function setup() {
	createCanvas(windowWidth, windowHeight, WEBGL);
	background(100);

	buildCubePoints(cubeFaceSize);
	initClaimMap();

	strokeWeight(2);

	for (let i = 0; i < 6; i++){
		let c3d = new AxisCursor(i, cubeFaceSize);
		cubeCursors.push(c3d);
	}
}

function initClaimMap() {
	claims = [];
	for (let p = 0; p < cols; p++) {
		claims[p] = [];
		for (let j = 0; j < cols; j++) {
			claims[p][j] = [];
			for (let i = 0; i < cols; i++) {
				claims[p][j][i] = 0;
			}
		}
	}
}

function buildCubePoints(cubeSize) {
	let halfFace = cubeSize / 2;
	cpts = [];
	cpts.push(createVector(-halfFace, -halfFace, halfFace)); //rear upper left, 0
	cpts.push(createVector(-halfFace, -halfFace, -halfFace)); //rear upper right, 1
	cpts.push(createVector(-halfFace, halfFace, -halfFace)); //rear lower right, 2
	cpts.push(createVector(-halfFace, halfFace, halfFace)); //rear lower left, 3
	cpts.push(createVector(halfFace, -halfFace, halfFace)); //front upper left, 4
	cpts.push(createVector(halfFace, -halfFace, -halfFace)); //front upper right, 5
	cpts.push(createVector(halfFace, halfFace, -halfFace)); //front lower right, 6
	cpts.push(createVector(halfFace, halfFace, halfFace)); //front lower left, 7
	cfaces = [];
	cfaces.push([cpts[4], cpts[5], cpts[6], cpts[7]]); //0  front x plane
	cfaces.push([cpts[5], cpts[1], cpts[2], cpts[6]]); //1  rear z plane
	cfaces.push([cpts[1], cpts[0], cpts[3], cpts[2]]); //2  rear x plane
	cfaces.push([cpts[0], cpts[4], cpts[7], cpts[3]]); //3  front z plane
	cfaces.push([cpts[0], cpts[1], cpts[5], cpts[4]]); //4  top y plane
	cfaces.push([cpts[3], cpts[2], cpts[6], cpts[7]]); //5  bottom y plane

	nextFacesU = [1, 2, 3, 0, 1, 1];
	nextFacesV = [5, 5, 5, 5, 0, 0];
	prevFacesU = [3, 0, 1, 2, 3, 3];
	prevFacesV = [4, 4, 4, 4, 2, 2];

	lockedAxis = ['X', 'Z', 'X', 'Z', 'Y', 'Y'];
}

function getFaceForSize(faceid, cubeSize){
	let halfFace = cubeSize / 2;
	let cpts2 = [];
	cpts2.push(createVector(-halfFace, -halfFace, halfFace)); //rear upper left, 0
	cpts2.push(createVector(-halfFace, -halfFace, -halfFace)); //rear upper right, 1
	cpts2.push(createVector(-halfFace, halfFace, -halfFace)); //rear lower right, 2
	cpts2.push(createVector(-halfFace, halfFace, halfFace)); //rear lower left, 3
	cpts2.push(createVector(halfFace, -halfFace, halfFace)); //front upper left, 4
	cpts2.push(createVector(halfFace, -halfFace, -halfFace)); //front upper right, 5
	cpts2.push(createVector(halfFace, halfFace, -halfFace)); //front lower right, 6
	cpts2.push(createVector(halfFace, halfFace, halfFace)); //front lower left, 7
	switch(faceid){
		case 0:
			return [cpts2[4], cpts2[5], cpts2[6], cpts2[7]]; //0  front x plane
		case 1:
			return [cpts2[5], cpts2[1], cpts2[2], cpts2[6]]   //1  rear z plane
		case 2:
			return [cpts2[1], cpts2[0], cpts2[3], cpts2[2]];  //2  rear x plane
		case 3:
			return [cpts2[0], cpts2[4], cpts2[7], cpts2[3]];  //3  front z plane
		case 4:
			return [cpts2[0], cpts2[1], cpts2[5], cpts2[4]];  //4  top y plane
		case 5:
			return [cpts2[3], cpts2[2], cpts2[6], cpts2[7]];  //5  bottom y plane
	}
	
	
}




function draw() {
	background(0);
	
	let x = 400 * cos(frameCount * 0.01);

	// Orbit the camera around the box.
	camera(x, -400, 800);


	noFill();
	stroke(255);
	for (let i = 0; i < cubeCursors.length; i++){
		let cc = cubeCursors[i];
		cc.move();
		cc.render();
	}
	

}

function snapPointToGrid(inpt){
	let subx = floor(inpt.x / gridSize);
	let suby = floor(inpt.y / gridSize);
	let subz = floor(inpt.z / gridSize);
	inpt.x = subx * gridSize;
	inpt.y = suby * gridSize;
	inpt.z = subz * gridSize;
	return inpt;
	
}

function getCoordinateFace(qFace, qSize=200){
	let fbounds = getBoundsFace(qFace, qSize);
	let px = fbounds.minx + random(fbounds.maxx - fbounds.minx);
	let py = fbounds.miny + random(fbounds.maxy - fbounds.miny);
	let pz = fbounds.minz + random(fbounds.maxz - fbounds.minz);
	let pt = createVector(px, py, pz);
	return snapPointToGrid(pt);
	
	
}

function getBoundsFace(qface, qSize=200) {
	//let facepts = cfaces[qface];
	let facepts = getFaceForSize(qface, qSize);
	let minx = 100000;
	let maxx = -100000;
	let miny = 100000;
	let maxy = -100000;
	let minz = 100000;
	let maxz = -100000;
	for (let i = 0; i < facepts.length; i++) {
		let pt = facepts[i];
		if (pt.x > maxx) {
			maxx = pt.x;
		}
		if (pt.y > maxy) {
			maxy = pt.y;
		}
		if (pt.z > maxz) {
			maxz = pt.z;
		}
		if (pt.x < minx) {
			minx = pt.x;
		}
		if (pt.y < miny) {
			miny = pt.y;
		}
		if (pt.z < minz) {
			minz = pt.z;
		}
	}
	return {
		minx: minx,
		maxx: maxx,
		miny: miny,
		maxy: maxy,
		minz: minz,
		maxz: maxz
	};
}

class AxisCursor {
	constructor(inface, incubesize) {
		this.onFace = inface;
		this.cursor = getCoordinateFace(inface, incubesize);
		this.pathx = [this.cursor.x]
		this.pathy = [this.cursor.y]
		this.pathz = [this.cursor.z]
		this.dx = 0;
		this.dy = 0;
		this.dx = 0;
		this.faceBounds = getBoundsFace(inface, incubesize);
		this.distInDir = 0;
		this.stuck = 0;
		this.cubeSize = incubesize;
		

		let locked = lockedAxis[inface];
		if (locked == 'X') {
			if (random(1) > 0.5) {
				this.dy = gridSize;
			} else {
				this.dz = gridSize;
			}
		} else if (locked == 'Y') {
			if (random(1) > 0.5) {
				this.dx = gridSize;
			} else {
				this.dz = gridSize;
			}
		} else {
			if (random(1) > 0.5) {
				this.dx = gridSize;
			} else {
				this.dy = gridSize;
			}
		}
	}

	render() {
		beginShape();
		for (let i = 0; i < this.pathx.length; i++) {
			let px = this.pathx[i];
			let py = this.pathy[i];
			let pz = this.pathz[i];

			vertex(px, py, pz);
		}
		endShape();
	}

	interiorDrop() {
		//migrate path to cube face surface one gridspace deeper
		//strange glitches when paths cross through center to other side- paths tunnel out and escape cube
		this.pathx.push(this.cursor.x);
		this.pathy.push(this.cursor.y);
		this.pathz.push(this.cursor.z);
		let locked = lockedAxis[this.onFace];
		if (locked == 'X') {
			if (this.cursor.x > 0) {
				this.cursor.x -= gridSize;
			} else {
				this.cursor.x += gridSize;
			}
		} else if (locked == 'Y') {
			if (this.cursor.y > 0) {
				this.cursor.y -= gridSize;
			} else {
				this.cursor.y += gridSize;
			}
		} else {
			if (this.cursor.z > 0) {
				this.cursor.z -= gridSize;
			} else {
				this.cursor.z += gridSize;
			}
		}
		this.pathx.push(this.cursor.x);
		this.pathy.push(this.cursor.y);
		this.pathz.push(this.cursor.z);
	}

	newFace(nfaceid) {
		let lockedPrev = lockedAxis[this.onFace];
		let lockedNow = lockedAxis[nfaceid];

		this.onFace = nfaceid;
		this.faceBounds = getBoundsFace(nfaceid, this.cubeSize);
	}

	move() {

		let min_val = 0 -  (this.cubeSize / 2);
		let max_val = (this.cubeSize / 2);

			
		let lastx = this.cursor.x;
		let lasty = this.cursor.y;
		let lastz = this.cursor.z;

		this.cursor.x += this.dx;
		this.cursor.y += this.dy;
		this.cursor.z += this.dz;

		if (this.cursor.x > this.faceBounds.maxx) {
			let over = this.cursor.x - this.faceBounds.maxx;
			this.cursor.x = this.faceBounds.maxx;
			this.newFace(0);
			let dxv = this.dx;
			if (this.cursor.z == max_val) {
				this.dz = -dxv;
			} else if (this.cursor.y == max_val) {
				this.dy = -dxv;
			} else if (this.cursor.y == min_val) {
				this.dy = dxv;
			} else if (this.cursor.z == min_val) {
				this.dz = dxv;
			}
			this.dx = 0;
		} else if (this.cursor.x < this.faceBounds.minx) {
			let over = this.faceBounds.minx - this.cursor.x;
			this.cursor.x = this.faceBounds.minx;
			this.newFace(2);
			let dxv = this.dx;
			if (this.cursor.z == max_val) {
				this.dz = dxv;
			} else if (this.cursor.z == min_val) {
				this.dz = -dxv;
			} else if (this.cursor.y == max_val) {
				this.dy = dxv;
			} else if (this.cursor.y == min_val) {
				this.dy = -dxv;
			}
			this.dx = 0;
		}
		if (this.cursor.y > this.faceBounds.maxy) {
			let over = this.cursor.y - this.faceBounds.maxy;
			this.cursor.y = this.faceBounds.maxy;
			this.newFace(5);
			let dyv = this.dy;
			if (this.cursor.z == max_val) {
				this.dz = -dyv;
			} else if (this.cursor.z == min_val) {
				this.dz = dyv;
			} else if (this.cursor.x == max_val) {
				this.dx = -dyv;
			} else if (this.cursor.x == min_val) {
				this.dx = dyv;
			}
			this.dy = 0;
		} else if (this.cursor.y < this.faceBounds.miny) {
			let over = this.faceBounds.miny - this.cursor.y;
			this.cursor.y = this.faceBounds.miny;
			this.newFace(4);
			let dyv = this.dy;
			if (this.cursor.z == max_val) {
				this.dz = dyv;
			} else if (this.cursor.z == min_val) {
				this.dz = -dyv;
			} else if (this.cursor.x == max_val) {
				this.dx = dyv;
			} else if (this.cursor.x == min_val) {
				this.dx = -dyv;
			}
			this.dy = 0;
		}
		if (this.cursor.z > this.faceBounds.maxz) {
			let over = this.cursor.z - this.faceBounds.maxz;
			this.cursor.z = this.faceBounds.maxz;
			this.newFace(3);
			let dzv = this.dz;
			if (this.cursor.y == max_val) {
				this.dy = -dzv;
			} else if (this.cursor.y == min_val) {
				this.dy = dzv;
			} else if (this.cursor.x == max_val) {
				this.dx = -dzv;
			} else if (this.cursor.x == min_val) {
				this.dx = dzv;
			}
			this.dz = 0;
		} else if (this.cursor.z < this.faceBounds.minz) {
			let over = this.faceBounds.minz - this.cursor.z;
			this.cursor.z = this.faceBounds.minz;
			this.newFace(1);
			let dzv = this.dz;
			if (this.cursor.y == max_val) {
				this.dy = dzv;
			} else if (this.cursor.y == min_val) {
				this.dy = -dzv;
			} else if (this.cursor.x == max_val) {
				this.dx = dzv;
			} else if (this.cursor.x == min_val) {
				this.dx = -dzv;
			}
			this.dz = 0;
		}

		let gx = floor(this.cursor.x / gridSize) + 20;
		let gy = floor(this.cursor.y / gridSize) + 20;
		let gz = floor(this.cursor.z / gridSize) + 20;

		let canGo = false;

		if (gx >= 0 && gx < cols && gy >= 0 && gy < cols && gz >= 0 && gz < cols) {
			if (claims[gx][gy][gz] == 0) {
				canGo = true;
				claims[gx][gy][gz] = 1;
			}

		}

		if (canGo) {
			this.stuck = 0;
			this.pathx.push(this.cursor.x);
			this.pathy.push(this.cursor.y);
			this.pathz.push(this.cursor.z);
			if (lineTrimLength > 0){
				if (this.pathx.length > lineTrimLength){
					this.pathx.shift();
					this.pathy.shift();
					this.pathz.shift();
				}
			}

			let blockedAhead = false;

			if (this.dx > 0) {
				if (gx < cols - 1) {
					blockedAhead = claims[gx + 1][gy][gz] == 1;
				}
			} else if (this.dx < 0) {
				if (gx > 0) {
					blockedAhead = claims[gx - 1][gy][gz] == 1;
				}
			} else if (this.dy > 0) {
				if (gy < cols - 1) {
					blockedAhead = claims[gx][gy + 1][gz] == 1;
				}
			} else if (this.dy < 0) {
				if (gy > 0) {
					blockedAhead = claims[gx][gy - 1][gz] == 1;
				}
			} else if (this.dz > 0) {
				if (gz < cols - 1) {
					blockedAhead = claims[gx][gy][gz + 1] == 1;
				}
			} else if (this.dz < 0) {
				if (gz > 0) {
					blockedAhead = claims[gx][gy][gz - 1] == 1;
				}

			}

			this.distInDir++;

			if (this.distInDir > 3 || blockedAhead) {
				if (random(1) > 0.65 || blockedAhead) {
					let prevdir;
					if (this.dx != 0) {
						prevdir = 'X';
					} else if (this.dy != 0) {
						prevdir = 'Y'
					} else {
						prevdir = 'Z';
					}
					this.dx = 0;
					this.dy = 0;
					this.dz = 0;
					this.distInDir = 0;
					let locked = lockedAxis[this.onFace];
					if (locked == 'X') {
						if (prevdir == 'Y') {
							if (random(1) > 0.5) {
								this.dz = gridSize;
							} else {
								this.dz = -gridSize;
							}
						} else {
							if (random(1) > 0.5) {
								this.dy = gridSize;
							} else {
								this.dy = -gridSize;
							}
						}

					} else if (locked == 'Y') {
						if (prevdir == 'X') {
							if (random(1) > 0.5) {
								this.dz = gridSize;
							} else {
								this.dz = -gridSize;
							}
						} else {
							if (random(1) > 0.5) {
								this.dx = gridSize;
							} else {
								this.dx = -gridSize;
							}
						}

					} else {
						if (prevdir == 'X') {
							if (random(1) > 0.5) {
								this.dy = gridSize;
							} else {
								this.dy = -gridSize;
							}
						} else {
							if (random(1) > 0.5) {
								this.dx = gridSize;
							} else {
								this.dx = -gridSize;
							}
						}

					}
				}
			}
		} else {
			this.stuck++;
			if (this.stuck > 10) {
				//if nowhere to path to on current face, go deeper one level to the surface underneath
				this.stuck = 0;
				this.cubeSize -= (gridSize * 2);
				this.interiorDrop();
				this.faceBounds = getBoundsFace(this.onFace, this.cubeSize);
			} else {
				
				this.cursor.x = lastx;
				this.cursor.y = lasty;
				this.cursor.z = lastz;
				let prevdir;
				if (this.dx != 0) {
					prevdir = 'X';
				} else if (this.dy != 0) {
					prevdir = 'Y'
				} else {
					prevdir = 'Z';
				}
				this.dx = 0;
				this.dy = 0;
				this.dz = 0;
				this.distInDir = 0;
				let locked = lockedAxis[this.onFace];
				if (locked == 'X') {
					if (prevdir == 'Y') {
						if (random(1) > 0.5) {
							this.dz = gridSize;
						} else {
							this.dz = -gridSize;
						}
					} else {
						if (random(1) > 0.5) {
							this.dy = gridSize;
						} else {
							this.dy = -gridSize;
						}
					}

				} else if (locked == 'Y') {
					if (prevdir == 'X') {
						if (random(1) > 0.5) {
							this.dz = gridSize;
						} else {
							this.dz = -gridSize;
						}
					} else {
						if (random(1) > 0.5) {
							this.dx = gridSize;
						} else {
							this.dx = -gridSize;
						}
					}

				} else {
					if (prevdir == 'X') {
						if (random(1) > 0.5) {
							this.dy = gridSize;
						} else {
							this.dy = -gridSize;
						}
					} else {
						if (random(1) > 0.5) {
							this.dx = gridSize;
						} else {
							this.dx = -gridSize;
						}
					}
				}
			}
		}

	}

}
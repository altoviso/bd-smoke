let Timer = (function(){
	if(typeof window !== "undefined"){
		if(window.performance){
			return class {
				constructor(){
					this.startMark = performance.now();
				}

				start(){
					this.startMark = performance.now();
				}

				get time(){
					// return elapsed time in ms since the last call of start or construction
					return (performance.now() - this.startMark) * 1000;
				}

				get startTime(){
					return this.startMark;
				}
			};
		}else{
			return class {
				constructor(){
					this.startMark = new Date();
				}

				start(){
					this.startMark = new Date();
				}

				get time(){
					// return elapsed time in ms since the last call of start or construction
					return (new Date()).getTime() - this.startMark.getTime();
				}

				get startTime(){
					return this.startMark;
				}
			};
		}
	}else{
		return class {
			constructor(){
				this.startMark = process.hrtime();
			}

			start(){
				return (this.startMark = process.hrtime());
			}

			get time(){
				// return elapsed time in ms since the last call of start or construction
				let diff = process.hrtime(this.startMark);
				return (diff[0] * 1000) + (diff[1] / 1000000);
			}

			get startTime(){
				return this.startMark;
			}
		};
	}
})();


export default Timer;

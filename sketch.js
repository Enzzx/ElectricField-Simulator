/* wid = largura
   hei = altura
   wV = vetores no eixo x */
const wid = 800
const hei = 600
const wV = 30
const hV = (hei/wid) * wV
const extraVectors = 2
const matrix = []

let xDrop, yDrop
let pressed = false
let message = true
let slider, check1, check2
let charges = []
let particles = []
let draggingCharge


function setup() {
  const canvas = createCanvas(wid, hei)
  angleMode(DEGREES)
  noStroke()

  //gerar grid de vetores
  const vectorW = int(width / wV)
  const vectorH = int(height / hV)
  yDrop = -vectorH * extraVectors

  for (let i = 0; i < hV + 2 * extraVectors; i++) {
    const rows = []
    matrix.push(rows)

    xDrop = -vectorW * extraVectors
    for (let j = 0; j < wV + 2 * extraVectors; j++) {
      rows.push(new Vector(xDrop, yDrop))
      xDrop += vectorW
    }
    yDrop += vectorH
  }

  //limpar tela
  const trash = createButton("Apagar")
  trash.position(width - 80, height + 20)
  trash.mousePressed(() => {
    charges.length = 0
    particles.length = 0
    message = false
  })
  
  // valores de carga
  slider = createSlider(50, 125, 75)
  check1 = createCheckbox("Positiva", true)
  check1.changed(checkVerification)
  check2 = createCheckbox("Negativa", false)
  check2.changed(checkVerification)
  
  //criar carga elétrica
  canvas.mouseClicked(() => {
    if ((charges.length >= 8 && !keyIsDown(SHIFT)) || pressed || message) {
      pressed = false
      return;
    }
    
    if (keyIsDown(SHIFT)) {
      particles.push(new Particle(mouseX, mouseY))
    } else {
      charges.push(new Charge(mouseX, mouseY, chargeMass, cation))
    }
  })
}

function draw() {
  if (message) {
    background(40)
    fill(255)
    textSize(wid/25)
    textAlign(CENTER, BOTTOM)
    text(`clique para posicionar uma carga\nArraste para simular uma carga\nPressione "shift" e clique para soltar carga de teste`, width/2, height/2)
    textSize(18)
    text("Aperte 'Apagar' para limpar a tela", width/2, height - 100)
  } else {
    background(10)
    fill("black")
    chargeMass = slider.value()
    cation = check1.checked()
    anion = check2.checked()
    textSize(20)
    textAlign(LEFT)
    fill("violet")
    text(`Massa: ${chargeMass}  carga: ${cation ? "Positiva" : "Negativa"}`, 0, height - 5)

    matrix.forEach((rows) => {
      rows.forEach((vector) => {
        vector.direction()
        vector.magnitude()
      })
    })

    charges.forEach((charge) => {
      charge.position()
    })
    
    particles.forEach(particle => {
      particle.direction()
      particle.position()
    })
  }
}


function mousePressed() {
  if (mouseX > width || mouseY > height || message || keyIsDown(SHIFT)) { return }
  draggingCharge = new Charge(mouseX, mouseY, chargeMass, cation)
  charges.push(draggingCharge)
}
function mouseDragged() {
  if (draggingCharge == undefined || message) { return }
  pressed = true
  draggingCharge.x = mouseX
  draggingCharge.y = mouseY
}
function mouseReleased() {
  const index = charges.indexOf(draggingCharge)
  if (index > -1) { charges.splice(index, 1) }
  draggingCharge = undefined
}

  
class Charge {
  constructor(x, y, mass, positive) {
    this.x = x
    this.y = y
    this.mass = mass
    this.positive = positive
    this.color = positive ? "#D83838" : "#4242EE"
  }

  position() {
    fill(this.color)
    circle(this.x, this.y, map(this.mass, 50, 125, 20, 40))
  }
}


class Vector {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.force = 0
    this.graus = 0
  }

  direction() {
    //calcular a direção e força da interação elétrica
    if(charges.length == 0) {
      this.force = 0
      this.graus = 0
      return 
    }
    
    const K = 1000
    let xTotal = 0
    let yTotal = 0
    
    charges.forEach(Q => {
      //lei de coulomb: F = (k*Q*q)/d**2
      //F: força elétrica; k: constante de coulomb; Q, q: carga elétrica e de teste; d: distância
      const deltaX = Q.x - this.x
      const deltaY = Q.y - this.y
      this.graus = atan2(deltaY, deltaX)
      let d = sqrt(deltaX**2 + deltaY**2)
      
      let F = Q.positive ? (K*-Q.mass)/d**2 : (K*Q.mass)/d**2
      
      //calcular força total em cada eixo
      xTotal += F * cos(this.graus)
      yTotal += F * sin(this.graus)
    })
                             
    this.force = sqrt(xTotal**2 + yTotal**2) * 2 //* 2 apenas para aumentar a escala dos vetores
    this.force = this.force > 100 ? 100 : this.force
    this.graus = atan2(yTotal, xTotal)
  }

  magnitude() {
    //mudar o tamanho e transparencia de acordo com a magnitude da força
    push()
    translate(this.x, this.y)
    rotate(this.graus)
    scale(map(this.force, 0, 100, 0.7, 1.6))
    //fill(map(this.force, 0, 100, 60, 10))
    fill(lerpColor(color(0, 140, 0), color(200, 40, 40), map(this.force, 0, 100, 0, 1)))
    rect(0, -1, 10, 2)
    triangle(10, -4, 10, 4, 14, 0)
    pop()
  }
}
  
class Particle extends Vector {
  constructor(x, y) {
    super(x, y)
    this.velX = 0
    this.velY = 0
  }
  
  position() {
    //a = F/m
    //a: aceleração; F: força elétrica; m: massa da carga de teste
    this.velX += (this.force * cos(this.graus))/15
    this.velY += (this.force * sin(this.graus))/15
    
    this.velX = this.x > width+7 && (this.velX > 4 || this.velX < -4) ? -1 : this.velX
    this.velX = this.x < 0-7 && (this.velX > 4 || this.velX < -4) ? 1 : this.velX
    
    this.velY = this.y > height+7 && (this.velY > 4 || this.velY < -4) ? -1 : this.velY 
    this.velY = this.y < 0-7 && (this.velY > 4 || this.velY < -4) ? 1 : this.velY 
    
    this.x += this.velX
    this.y += this.velY
    fill("firebrick")
    circle(this.x, this.y, 14)
  }
}
  

function checkVerification() {
  if (
    (check1.checked() && check2.checked()) ||
    (!check1.checked() && !check2.checked())
  ) {
    if (this == check1) {
      check1.checked(true)
      check2.checked(false)
    } else {
      check1.checked(false)
      check2.checked(true)
    }
  }
}
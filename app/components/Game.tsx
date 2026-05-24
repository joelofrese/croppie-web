"use client";

import { useEffect, useRef } from "react";
import * as Phaser from "phaser";

const SPEED = 80;
const WORLD_W = 320;
const WORLD_H = 180;

export default function Game() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    class GameScene extends Phaser.Scene {
      private croppie!: Phaser.GameObjects.Sprite;
      private keys!: Record<string, Phaser.Input.Keyboard.Key>;
      private keyOrder: string[] = [];
      private currentDir = "walk-left";
      private isMoving = false;

      preload() {
        this.load.image("background", "/sprites/background.png");
        this.load.aseprite("croppie", "/sprites/croppie.png", "/sprites/croppie.json");
      }

      private applyZoom() {
        const zoom = Math.max(this.scale.width / WORLD_W, this.scale.height / WORLD_H);
        this.cameras.main.setZoom(zoom);
      }

      create() {
        this.add.image(0, 0, "background").setOrigin(0, 0);

        this.anims.createFromAseprite("croppie");

        this.applyZoom();
        this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

        this.croppie = this.add.sprite(
          WORLD_W / 2 + 40,
          WORLD_H / 2 + 10,
          "croppie"
        );

        this.cameras.main.startFollow(this.croppie);

        const saved = localStorage.getItem("pos");
        let startDir = "walk-left";
        if (saved) {
          const { x, y, dir, flipX } = JSON.parse(saved);
          this.croppie.setPosition(x, y);
          this.croppie.setFlipX(flipX ?? false);
          startDir = dir ?? "walk-left";
        }

        this.showStanding(startDir);
        

        this.scale.on("resize", this.applyZoom, this);

        const interactZone = new Phaser.Geom.Rectangle(
          WORLD_W / 2 - 25,
          WORLD_H / 2 - 25,
          50,
          40
        );

        this.input.keyboard!.on("keydown-SPACE", () => {
          if (Phaser.Geom.Rectangle.Contains(interactZone, this.croppie.x, this.croppie.y)) {
            window.open("/meow", "_self");
          }
        });

        this.keys = this.input.keyboard!.addKeys("W,A,S,D") as Record<string, Phaser.Input.Keyboard.Key>;

        ["W", "A", "S", "D"].forEach((name) => {
          const key = this.keys[name];
          key.on("down", () => {
            if (!this.keyOrder.includes(name)) this.keyOrder.push(name);
          });
          key.on("up", () => {
            this.keyOrder = this.keyOrder.filter((k) => k !== name);
          });
        });
      }

      private showStanding(animKey: string) {
        const standKey = animKey.replace("walk-", "stand-");
        if (this.croppie.anims.currentAnim?.key !== standKey || !this.croppie.anims.isPlaying) {
          const startFrame = (this.croppie.anims.currentFrame?.index ?? 1) - 1;
          this.croppie.play({ key: standKey, repeat: -1, startFrame });
        }
        this.currentDir = animKey;
      }

      update(_time: number, delta: number) {
        const dt = delta / 1000;
        const activeKey = this.keyOrder[this.keyOrder.length - 1];

        if (!activeKey) {
          if (this.isMoving) {
            this.showStanding(this.currentDir);
            this.isMoving = false;
          }
          return;
        }

        let dx = 0;
        let dy = 0;
        let animKey = this.currentDir;
        let flipX = false;

        switch (activeKey) {
          case "A":
            dx = -SPEED;
            animKey = "walk-left";
            break;
          case "D":
            dx = SPEED;
            animKey = "walk-left";
            flipX = true;
            break;
          case "W":
            dy = -SPEED;
            animKey = "walk-up";
            break;
          case "S":
            dy = SPEED;
            animKey = "walk-down";
            break;
        }

        this.croppie.setFlipX(flipX);

        if (this.croppie.anims.currentAnim?.key !== animKey || !this.croppie.anims.isPlaying) {
          this.croppie.play(animKey);
        }

        this.currentDir = animKey;
        this.isMoving = true;
        this.croppie.x = Phaser.Math.Clamp(this.croppie.x + dx * dt, 14, WORLD_W - 14);
        this.croppie.y = Phaser.Math.Clamp(this.croppie.y + dy * dt, 11, WORLD_H - 11);
        localStorage.setItem("pos", JSON.stringify({ x: this.croppie.x, y: this.croppie.y, dir: this.currentDir, flipX: this.croppie.flipX }));
      }
    }

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      scene: GameScene,
      parent: containerRef.current ?? undefined,
      backgroundColor: "#000000",
      pixelArt: true,
      scale: {
        mode: Phaser.Scale.RESIZE,
      },
    });

    return () => {
      game.destroy(true);
    };
  }, []);

  return <div ref={containerRef} className="w-full h-screen overflow-hidden" />;
}

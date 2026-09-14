import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  readonly previewItems = [
    { icon: 'bi-lamp', name: 'Poltrona de leitura', category: 'Casa/Móveis', price: 'R$ 1.250' },
    { icon: 'bi-bag', name: 'Tênis Adidas', category: 'Calçados', price: 'R$ 400' },
    { icon: 'bi-controller', name: 'Steam Deck', category: 'Eletrônicos', price: 'R$ 2.900' },
    { icon: 'bi-bookmark-heart', name: 'Casaco de lã bege', category: 'Têxteis', price: 'R$ 189,90' },
  ];

  readonly previewCategories = [
    { icon: 'bi-lamp', label: 'Móveis' },
    { icon: 'bi-bag', label: 'Sapatos' },
    { icon: 'bi-laptop', label: 'Eletrônicos' },
    { icon: 'bi-bookmark-heart', label: 'Têxteis' },
  ];

  readonly features = [
    {
      icon: 'bi-tag',
      title: 'Categorias do seu jeito',
      description: 'Agrupe por cômodo, tipo ou uso — de móveis a calçados, tudo no lugar certo.',
    },
    {
      icon: 'bi-clock-history',
      title: 'Histórico de mudanças',
      description: 'Veja cada alteração: quando guardou, editou o valor ou anexou uma foto.',
    },
    {
      icon: 'bi-camera',
      title: 'Fotos e anexos',
      description: 'Guarde a cara dos seus pertences com fotos da câmera ou arquivos.',
    },
    {
      icon: 'bi-box-seam',
      title: 'Situação clara',
      description: 'Marque como Em uso, Guardado ou Doado e encontre tudo num olhar.',
    },
  ];

  readonly steps = [
    {
      number: '01',
      title: 'Crie seu cantinho',
      description: 'Cadastre-se em segundos e ganhe um espaço só seu, calmo e organizado.',
    },
    {
      number: '02',
      title: 'Guarde cada coisa',
      description: 'Adicione itens com nome, categoria, valor, fotos e observações.',
    },
    {
      number: '03',
      title: 'Encontre tudo',
      description: 'Busque, filtre e acompanhe o histórico — sua casa, sempre em ordem.',
    },
  ];

  readonly associationBullets = [
    'Vínculos múltiplos: um item pode ligar-se a vários outros',
    'Busca por nome ou categoria ao vincular',
    'Remova vínculos com um toque, sem perder o item',
  ];

  readonly associationMain = {
    icon: 'bi-laptop',
    name: 'Notebook Dell Inspiron',
    category: 'Eletrônicos · Em uso',
  };

  readonly associationLinks = [
    { icon: 'bi-box-seam', color: 'green', name: 'SSD Samsung 1TB', category: 'Eletrônicos' },
    { icon: 'bi-bag', color: 'purple', name: 'Capa protetora 14"', category: 'Acessórios' },
    { icon: 'bi-mouse2', color: 'green', name: 'Mouse sem fio Logitech', category: 'Eletrônicos' },
    { icon: 'bi-plug', color: 'orange', name: 'Carregador extra 65W', category: 'Eletrônicos' },
  ];

  ngOnInit() {
    if (isPlatformBrowser(this.platformId) && this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
    }
  }
}

from django.db import models


# Create your models here.
class Subscriber(models.Model):
    """Класс отвечающий за прием новых подписчиков"""
    email = models.EmailField()
    name = models.CharField(max_length=128)

    def __str__(self):
        return "Пользователь %s %s" % (self.name, self.email,)

    class Meta:
        verbose_name = 'MySubscriber'
        verbose_name_plural = 'A lot of Subscribers'

from django.http import HttpResponseRedirect
from django.shortcuts import render
from .forms import SubscriberForm


# Create your views here.
def index(request):
    name = "Michal"
    form = SubscriberForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        print(request.POST)
        print(form.cleaned_data)
        data = form.cleaned_data
        print(data["name"])
        new_form = form.save()
        return HttpResponseRedirect(request.META.get('HTTP_REFERER'))
    return render(request, 'main/index.html', {'form': form})
